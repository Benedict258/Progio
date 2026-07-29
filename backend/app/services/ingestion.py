import asyncio
import hashlib
import logging
import random
import re
import uuid
from datetime import date, datetime, timedelta
from math import sqrt

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session
from app.models.alert_preference import AlertPreference
from app.models.notification import Notification
from app.models.opportunity import Opportunity
from app.models.user import User

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Mock grant/scholarship data (simulates public API responses)
# ---------------------------------------------------------------------------

MOCK_OPPORTUNITIES = [
    {
        "type": "grant",
        "title": "NSF Graduate Research Fellowship Program",
        "provider": "National Science Foundation",
        "award_range": "$37,000/year for 3 years",
        "region": "United States",
        "field_tags": ["Computer Science", "Engineering", "Mathematics", "Physics", "Biology"],
        "eligibility_criteria": {"degree": "graduate", "citizenship": "US"},
    },
    {
        "type": "grant",
        "title": "EU Horizon Europe Research Grant",
        "provider": "European Commission",
        "award_range": "€100,000 - €2,500,000",
        "region": "Europe",
        "field_tags": ["STEM", "Health Sciences", "Environmental Science", "Social Sciences"],
        "eligibility_criteria": {"degree": "graduate", "citizenship": "EU"},
    },
    {
        "type": "grant",
        "title": "Gates Foundation Innovation Fund",
        "provider": "Bill & Melinda Gates Foundation",
        "award_range": "$50,000 - $500,000",
        "region": "Global",
        "field_tags": ["Health Sciences", "Education", "Agriculture", "Technology"],
        "eligibility_criteria": {"degree": "open"},
    },
    {
        "type": "grant",
        "title": "NIH R01 Research Project Grant",
        "provider": "National Institutes of Health",
        "award_range": "$250,000 - $750,000/year",
        "region": "United States",
        "field_tags": ["Health Sciences", "Biology", "Medicine", "Biomedical"],
        "eligibility_criteria": {"degree": "postdoc", "citizenship": "US"},
    },
    {
        "type": "grant",
        "title": "AWS Research Grants for AI/ML",
        "provider": "Amazon Web Services",
        "award_range": "$25,000 - $100,000",
        "region": "Global",
        "field_tags": ["Computer Science", "AI", "Machine Learning", "Data Science"],
        "eligibility_criteria": {"degree": "graduate"},
    },
    {
        "type": "grant",
        "title": "Ford Foundation Fellowship Program",
        "provider": "Ford Foundation",
        "award_range": "$25,000 - $28,000/year",
        "region": "United States",
        "field_tags": ["Social Sciences", "Humanities", "Engineering", "STEM"],
        "eligibility_criteria": {"degree": "graduate", "minority": True},
    },
    {
        "type": "scholarship",
        "title": "Fulbright Foreign Student Program",
        "provider": "U.S. Department of State",
        "award_range": "$15,000 - $30,000",
        "region": "Global",
        "field_tags": ["All Fields"],
        "eligibility_criteria": {"degree": "graduate", "citizenship": "non-US"},
    },
    {
        "type": "scholarship",
        "title": "Chevening Scholarship",
        "provider": "UK Government",
        "award_range": "Full tuition + living stipend",
        "region": "Global",
        "field_tags": ["All Fields"],
        "eligibility_criteria": {"degree": "graduate", "experience": "2+ years"},
    },
    {
        "type": "scholarship",
        "title": "Rhodes Scholarship",
        "provider": "Rhodes Trust",
        "award_range": "Full tuition + stipend at Oxford",
        "region": "Global",
        "field_tags": ["All Fields"],
        "eligibility_criteria": {"degree": "graduate", "min_gpa": 3.7},
    },
    {
        "type": "scholarship",
        "title": "Google Women Techmakers Scholarship",
        "provider": "Google",
        "award_range": "$10,000",
        "region": "North America",
        "field_tags": ["Computer Science", "Engineering", "AI"],
        "eligibility_criteria": {"degree": "undergraduate", "gender": "female"},
    },
    {
        "type": "scholarship",
        "title": "MITACS Globalink Research Internship",
        "provider": "MITACS",
        "award_range": "$6,000 CAD",
        "region": "Global",
        "field_tags": ["STEM", "Engineering", "Computer Science"],
        "eligibility_criteria": {"degree": "undergraduate"},
    },
    {
        "type": "grant",
        "title": "Wellcome Trust Discovery Award",
        "provider": "Wellcome Trust",
        "award_range": "£200,000 - £2,000,000",
        "region": "Europe",
        "field_tags": ["Health Sciences", "Biology", "Neuroscience", "Medicine"],
        "eligibility_criteria": {"degree": "postdoc"},
    },
    {
        "type": "grant",
        "title": "Chan Zuckerberg Initiative Rare Disease Research",
        "provider": "Chan Zuckerberg Initiative",
        "award_range": "$150,000 - $1,500,000",
        "region": "Global",
        "field_tags": ["Biomedical", "Health Sciences", "Biology", "Medicine"],
        "eligibility_criteria": {"degree": "postdoc"},
    },
    {
        "type": "scholarship",
        "title": "DAAD German Academic Exchange Scholarship",
        "provider": "DAAD",
        "award_range": "€850 - €1,200/month",
        "region": "Europe",
        "field_tags": ["All Fields"],
        "eligibility_criteria": {"degree": "graduate"},
    },
    {
        "type": "scholarship",
        "title": "Aga Khan Foundation International Scholarship",
        "provider": "Aga Khan Foundation",
        "award_range": "50% tuition grant",
        "region": "Africa",
        "field_tags": ["All Fields"],
        "eligibility_criteria": {"degree": "graduate", "financial_need": True},
    },
]


def _generate_deadline() -> str:
    """Return a random future deadline between 14 and 180 days out."""
    days = random.randint(14, 180)
    return (datetime.utcnow() + timedelta(days=days)).date().isoformat()


def _make_embedding_dim128(text: str) -> list[float]:
    """Deterministic hash-based 128-dim embedding (same algo as matching.py)."""
    tokens = re.findall(r"[a-z0-9]+", text.lower())
    if not tokens:
        return [0.0] * 128
    from collections import Counter
    counts = Counter(tokens)
    total = len(tokens)
    vec = [0.0] * 128
    for tok, cnt in counts.items():
        tf = cnt / total
        dg = hashlib.sha256(tok.encode()).digest()
        for i in range(128):
            sign = 1.0 if dg[i % 32] % 2 == 0 else -1.0
            mag = (dg[(i + 1) % 32] / 255.0) * 2.0
            vec[i] += sign * mag * tf
    norm = sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]


# ---------------------------------------------------------------------------
# Core ingestion logic
# ---------------------------------------------------------------------------

async def _fetch_mock_opportunities() -> list[dict]:
    """Simulate fetching from public grant/scholarship APIs."""
    # Randomly pick 5-8 opportunities each run to simulate new data
    count = random.randint(5, 8)
    selected = random.sample(MOCK_OPPORTUNITIES, min(count, len(MOCK_OPPORTUNITIES)))
    results = []
    for opp in selected:
        entry = opp.copy()
        entry["id"] = str(uuid.uuid4())
        entry["deadline"] = _generate_deadline()
        results.append(entry)
    return results


async def _insert_opportunities(db: AsyncSession, raw_opps: list[dict]) -> list[Opportunity]:
    """Insert new opportunities and return the created objects."""
    created = []
    for raw in raw_opps:
        # Build embedding text
        parts = list(raw.get("field_tags", []))
        parts.append(raw.get("title", ""))
        parts.append(raw.get("provider", ""))
        if raw.get("region"):
            parts.append(raw["region"])
        emb_text = " ".join(parts)
        embedding = _make_embedding_dim128(emb_text)

        opp = Opportunity(
            id=raw["id"],
            type=raw["type"],
            title=raw["title"],
            provider=raw["provider"],
            award_range=raw.get("award_range"),
            deadline=date.fromisoformat(raw["deadline"]) if raw.get("deadline") else None,
            field_tags=raw.get("field_tags"),
            region=raw.get("region"),
            eligibility_criteria=raw.get("eligibility_criteria"),
            source_url=raw.get("source_url"),
            embedding=embedding,
        )
        db.add(opp)
        created.append(opp)
    await db.flush()
    logger.info("Inserted %d new opportunities", len(created))
    return created


# ---------------------------------------------------------------------------
# Matching & alert creation
# ---------------------------------------------------------------------------

def _simple_match_score(user: User, opp: Opportunity) -> float:
    """Quick rule-based match (0-100). Uses same logic as matching.py."""
    score = 0.0

    # Field match
    if user.field_of_study and opp.field_tags:
        uf = user.field_of_study.lower()
        tags = [t.lower() for t in opp.field_tags]
        if uf in tags:
            score += 25
        elif any(uf in t or t in uf for t in tags):
            score += 15

    # Level match
    if user.level and opp.eligibility_criteria:
        req = str(opp.eligibility_criteria.get("degree", "open")).lower()
        if req == "open":
            score += 10
        elif user.level.lower() in req or req in user.level.lower():
            score += 20

    # Region match
    if user.region and opp.region:
        if opp.region.lower() == "global":
            score += 15
        elif user.region.lower() == opp.region.lower():
            score += 15

    return min(score, 100.0)


async def _check_alerts_and_notify(
    db: AsyncSession,
    new_opps: list[Opportunity],
) -> int:
    """Match new opportunities against alert preferences; create notifications."""
    # Fetch all alert preferences
    result = await db.execute(select(AlertPreference))
    prefs = list(result.scalars().all())
    if not prefs:
        return 0

    # Fetch all users
    user_result = await db.execute(select(User))
    users = {u.id: u for u in user_result.scalars().all()}

    notifications_created = 0

    for pref in prefs:
        user = users.get(pref.user_id)
        if not user:
            continue

        filters = pref.filters or {}
        field_filter = filters.get("field_of_study", "Any")
        region_filter = filters.get("region", "Any")
        deadline_filter = filters.get("deadline_urgency", "any")

        for opp in new_opps:
            # Type filter
            if opp.type != pref.track:
                continue

            # Field filter
            if field_filter and field_filter != "Any":
                if opp.field_tags:
                    if field_filter.lower() not in [t.lower() for t in opp.field_tags]:
                        continue
                else:
                    continue

            # Region filter
            if region_filter and region_filter != "Any":
                if opp.region and opp.region.lower() != region_filter.lower():
                    continue

            # Deadline filter
            if deadline_filter and deadline_filter != "any" and opp.deadline:
                days_left = (opp.deadline - date.today()).days
                if deadline_filter == "1_week" and days_left > 7:
                    continue
                if deadline_filter == "1_month" and days_left > 30:
                    continue
                if deadline_filter == "3_months" and days_left > 90:
                    continue

            # Compute match score
            score = _simple_match_score(user, opp)
            if score < 10:
                continue

            # Check for existing notification (avoid duplicates)
            existing = await db.execute(
                select(Notification).where(
                    Notification.user_id == user.id,
                    Notification.opportunity_id == opp.id,
                    Notification.alert_preference_id == pref.id,
                )
            )
            if existing.scalar_one_or_none():
                continue

            notif = Notification(
                user_id=user.id,
                opportunity_id=opp.id,
                alert_preference_id=pref.id,
                title=f"New {opp.type} match: {opp.title}",
                message=f"{opp.provider} — {opp.award_range or 'Award varies'}. Deadline: {opp.deadline}. Score: {score}/100.",
                match_score=score,
            )
            db.add(notif)
            notifications_created += 1

    await db.flush()
    return notifications_created


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

async def run_ingestion() -> dict:
    """Full ingestion cycle: fetch → insert → match → notify. Returns summary."""
    summary = {
        "timestamp": datetime.utcnow().isoformat(),
        "fetched": 0,
        "inserted": 0,
        "notifications": 0,
        "errors": [],
    }

    try:
        raw_opps = await _fetch_mock_opportunities()
        summary["fetched"] = len(raw_opps)

        async with async_session() as db:
            async with db.begin():
                created = await _insert_opportunities(db, raw_opps)
                summary["inserted"] = len(created)

                notif_count = await _check_alerts_and_notify(db, created)
                summary["notifications"] = notif_count

            await db.commit()

    except Exception as e:
        logger.exception("Ingestion failed")
        summary["errors"].append(str(e))

    logger.info("Ingestion complete: %s", summary)
    return summary
