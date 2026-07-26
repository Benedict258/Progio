import hashlib
import re
import math
from collections import Counter

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.opportunity import Opportunity


EMBEDDING_DIM = 128


def _text_to_embedding(text: str) -> list[float]:
    """Deterministic hash-based embedding for demo purposes.

    Splits text into tokens, hashes each token to produce a 128-dim vector
    that approximates TF-IDF characteristics without needing a trained model.
    """
    tokens = re.findall(r"[a-z0-9]+", text.lower())
    if not tokens:
        return [0.0] * EMBEDDING_DIM

    token_counts = Counter(tokens)
    total = len(tokens)
    vec = [0.0] * EMBEDDING_DIM

    for token, count in token_counts.items():
        tf = count / total
        digest = hashlib.sha256(token.encode()).digest()
        for i in range(EMBEDDING_DIM):
            sign = 1.0 if digest[i % 32] % 2 == 0 else -1.0
            magnitude = (digest[(i + 1) % 32] / 255.0) * 2.0
            vec[i] += sign * magnitude * tf

    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]


def _build_opportunity_embedding(opp: Opportunity) -> str:
    """Build a text representation of an opportunity for embedding."""
    parts = []
    if opp.field_tags:
        parts.extend(opp.field_tags)
    if opp.eligibility_criteria:
        for k, v in opp.eligibility_criteria.items():
            parts.append(f"{k}: {v}")
    if opp.region:
        parts.append(opp.region)
    if opp.title:
        parts.append(opp.title)
    if opp.provider:
        parts.append(opp.provider)
    return " ".join(parts)


def _build_user_embedding(user: User) -> str:
    """Build a text representation of a user for embedding."""
    parts = []
    if user.field_of_study:
        parts.append(user.field_of_study)
    if user.funding_needs:
        for k, v in user.funding_needs.items():
            parts.append(f"{k}: {v}")
    if user.past_projects:
        for proj in user.past_projects:
            if isinstance(proj, dict) and "title" in proj:
                parts.append(proj["title"])
    if user.level:
        parts.append(user.level)
    if user.region:
        parts.append(user.region)
    return " ".join(parts)


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a)) or 1.0
    norm_b = math.sqrt(sum(x * x for x in b)) or 1.0
    return dot / (norm_a * norm_b)


def _check_field_match(user_field: str | None, tags: list[str] | None) -> tuple[bool, bool]:
    """Returns (exact_match, partial_match)."""
    if not user_field or not tags:
        return False, False
    user_lower = user_field.lower()
    tags_lower = [t.lower() for t in tags]

    if user_lower in tags_lower:
        return True, False

    for tag in tags_lower:
        if user_lower in tag or tag in user_lower:
            return False, True

    return False, False


def _check_level_match(user_level: str | None, criteria: dict | None) -> tuple[bool, bool]:
    """Returns (exact_match, partial_match)."""
    if not user_level or not criteria:
        return False, False
    user_lower = user_level.lower()
    req_degree = str(criteria.get("degree", "")).lower()

    if not req_degree or req_degree == "open":
        return False, True
    if user_lower in req_degree or req_degree in user_lower:
        return True, False
    if user_lower == "phd" and "phd" in req_degree:
        return True, False
    return False, False


def _check_region_match(user_region: str | None, opp_region: str | None) -> bool:
    if not user_region or not opp_region:
        return False
    if opp_region.lower() == "global":
        return True
    return user_region.lower() == opp_region.lower()


async def compute_matches(
    db: AsyncSession,
    user_id: str,
    opp_type: str | None = None,
) -> list[dict]:
    """Compute match scores for a user against all opportunities."""
    user = await db.get(User, user_id)
    if not user:
        raise ValueError(f"User {user_id} not found")

    query = select(Opportunity)
    if opp_type:
        query = query.where(Opportunity.type == opp_type)
    result = await db.execute(query)
    opportunities = list(result.scalars().all())

    if not opportunities:
        return []

    user_text = _build_user_embedding(user)
    user_vec = _text_to_embedding(user_text)

    matches = []
    for opp in opportunities:
        # --- Rule-based scoring ---
        rule_score = 0.0
        reasons = []

        field_exact, field_partial = _check_field_match(user.field_of_study, opp.field_tags)
        if field_exact:
            rule_score += 20
            reasons.append(f"Direct field match: {user.field_of_study} is in the opportunity tags")
        elif field_partial:
            rule_score += 12
            reasons.append(f"Related field: {user.field_of_study} aligns with {opp.field_tags}")
        else:
            reasons.append("Field of study not explicitly listed in opportunity tags")

        level_exact, level_partial = _check_level_match(user.level, opp.eligibility_criteria)
        req_degree = (opp.eligibility_criteria or {}).get("degree", "open")
        if level_exact:
            rule_score += 15
            reasons.append(f"Academic level matches: {user.level} meets requirement ({req_degree})")
        elif level_partial:
            rule_score += 8
            reasons.append(f"Academic level partially matches: {user.level} / requirement: {req_degree}")
        else:
            reasons.append(f"Academic level: {user.level} vs requirement: {req_degree}")

        if _check_region_match(user.region, opp.region):
            rule_score += 15
            reasons.append(f"Region match: {user.region} is eligible (opportunity is {opp.region})")
        else:
            reasons.append(f"Region: {user.region} vs opportunity region: {opp.region}")

        # --- Vector similarity scoring ---
        opp_text = _build_opportunity_embedding(opp)
        opp_vec = _text_to_embedding(opp_text)
        similarity = _cosine_similarity(user_vec, opp_vec)
        vector_score = round(similarity * 50, 2)
        vector_score = max(0, min(50, vector_score))
        reasons.append(f"Semantic similarity score: {round(similarity, 3)}")

        total_score = round(rule_score + vector_score, 1)
        total_score = max(0, min(100, total_score))

        matches.append({
            "opportunity_id": opp.id,
            "score": total_score,
            "match_reasons": reasons,
        })

    matches.sort(key=lambda m: m["score"], reverse=True)
    return matches
