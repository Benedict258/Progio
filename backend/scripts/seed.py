import sys
import uuid
import asyncio
from datetime import date, datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.core.config import settings
from app.models import (
    User, Opportunity, Application, ResearchProject,
    Project, ReadinessAssessment, AlertPreference,
)

USERS = [
    {
        "id": "user-001",
        "name": "Dr. Amara Osei",
        "email": "amara.osei@ug.edu.gh",
        "institution": "University of Ghana",
        "field_of_study": "Computational Biology",
        "level": "PhD",
        "region": "West Africa",
        "funding_needs": {"tuition": 15000, "research": 25000, "living": 10000},
        "past_projects": [
            {"title": "Genomic analysis of malaria resistance", "year": 2024, "outcome": "published"}
        ],
        "profile_completion_pct": 85.0,
    },
    {
        "id": "user-002",
        "name": "Liam Chen",
        "email": "liam.chen@stanford.edu",
        "institution": "Stanford University",
        "field_of_study": "Political Science",
        "level": "Masters",
        "region": "North America",
        "funding_needs": {"tuition": 55000, "research": 8000, "living": 20000},
        "past_projects": [],
        "profile_completion_pct": 62.0,
    },
]

GRANTS = [
    {
        "id": "opp-g001",
        "type": "grant",
        "title": "NIH R01 - Computational Genomics for Global Health",
        "provider": "National Institutes of Health",
        "eligibility_criteria": {"degree": "PhD or equivalent", "field": "Life Sciences", "citizenship": "open"},
        "award_range": "$250,000 - $500,000",
        "deadline": date(2026, 11, 15),
        "field_tags": ["STEM", "Biology", "Genomics", "Public Health"],
        "region": "Global",
        "source_url": "https://grants.nih.gov/sample",
    },
    {
        "id": "opp-g002",
        "type": "grant",
        "title": "NSF CAREER Award - Social Computing",
        "provider": "National Science Foundation",
        "eligibility_criteria": {"degree": "PhD", "field": "Computer Science / Social Science", "career_stage": "early-career"},
        "award_range": "$400,000 - $600,000",
        "deadline": date(2027, 2, 1),
        "field_tags": ["STEM", "Computer Science", "Social Science", "AI"],
        "region": "United States",
        "source_url": "https://nsf.gov/career",
    },
    {
        "id": "opp-g003",
        "type": "grant",
        "title": "Ford Foundation - Racial Justice Research",
        "provider": "Ford Foundation",
        "eligibility_criteria": {"degree": "open", "field": "Social Sciences / Humanities", "focus": "racial justice"},
        "award_range": "$50,000 - $150,000",
        "deadline": date(2027, 3, 30),
        "field_tags": ["Social Sciences", "Humanities", "Racial Justice", "Policy"],
        "region": "Global",
        "source_url": "https://fordfoundation.org/grants",
    },
    {
        "id": "opp-g004",
        "type": "grant",
        "title": "NEA Research Grants in the Arts",
        "provider": "National Endowment for the Arts",
        "eligibility_criteria": {"degree": "open", "field": "Arts / Art History", "project_based": True},
        "award_range": "$10,000 - $100,000",
        "deadline": date(2027, 1, 20),
        "field_tags": ["Arts", "Art History", "Creative Research"],
        "region": "United States",
        "source_url": "https://arts.gov/grants",
    },
    {
        "id": "opp-g005",
        "type": "grant",
        "title": "Gates Foundation - Global Health Innovation",
        "provider": "Bill & Melinda Gates Foundation",
        "eligibility_criteria": {"degree": "advanced", "field": "Global Health / Engineering", "impact_focus": True},
        "award_range": "$200,000 - $1,000,000",
        "deadline": date(2027, 6, 1),
        "field_tags": ["STEM", "Global Health", "Engineering", "Innovation"],
        "region": "Global",
        "source_url": "https://gatesfoundation.org/grants",
    },
]

SCHOLARSHIPS = [
    {
        "id": "opp-s001",
        "type": "scholarship",
        "title": "Rhodes Scholarship - University of Oxford",
        "provider": "Rhodes Trust",
        "eligibility_criteria": {"degree": "Masters", "age_limit": 27, "field": "open"},
        "award_range": "Full tuition + living stipend",
        "deadline": date(2026, 10, 1),
        "field_tags": ["Masters", "Leadership", "Open Field"],
        "region": "Global",
        "source_url": "https://rhodeshouse.ox.ac.uk/scholarships",
    },
    {
        "id": "opp-s002",
        "type": "scholarship",
        "title": "GEM Fellowship - STEM PhD",
        "provider": "National GEM Consortium",
        "eligibility_criteria": {"degree": "PhD", "field": "STEM", "demographics": "underrepresented minorities"},
        "award_range": "Full tuition + stipend + internship",
        "deadline": date(2026, 12, 1),
        "field_tags": ["PhD", "STEM", "Diversity"],
        "region": "United States",
        "source_url": "https://gemfellowship.org",
    },
    {
        "id": "opp-s003",
        "type": "scholarship",
        "title": "DAAD Research Grant - German Universities",
        "provider": "DAAD (German Academic Exchange Service)",
        "eligibility_criteria": {"degree": "PhD / Postdoc", "field": "open", "language": "English or German"},
        "award_range": "€1,200 - €2,500/month",
        "deadline": date(2027, 4, 15),
        "field_tags": ["PhD", "Postdoc", "Research", "International"],
        "region": "Europe",
        "source_url": "https://daad.de/en/study-and-research",
    },
    {
        "id": "opp-s004",
        "type": "scholarship",
        "title": "Fulbright Foreign Student Program",
        "provider": "U.S. Department of State",
        "eligibility_criteria": {"degree": "Masters / PhD", "field": "open", "citizenship": "non-US"},
        "award_range": "Full tuition + travel + stipend",
        "deadline": date(2027, 5, 1),
        "field_tags": ["Masters", "PhD", "Cultural Exchange", "Open Field"],
        "region": "Global",
        "source_url": "https://foreign.fulbrightonline.org",
    },
    {
        "id": "opp-s005",
        "type": "scholarship",
        "title": "Knight-Hennessy Scholars - Stanford",
        "provider": "Stanford University",
        "eligibility_criteria": {"degree": "any graduate", "field": "open", "leadership": True},
        "award_range": "Full funding for any Stanford graduate program",
        "deadline": date(2026, 10, 8),
        "field_tags": ["Graduate", "Leadership", "Open Field"],
        "region": "Global",
        "source_url": "https://knight-hennessy.stanford.edu",
    },
]


async def seed():
    engine = create_async_engine(settings.DATABASE_URL)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with session_factory() as session:
        for u in USERS:
            await session.execute(pg_insert(User).values(**u).on_conflict_do_nothing(index_elements=["id"]))

        for g in GRANTS + SCHOLARSHIPS:
            await session.execute(pg_insert(Opportunity).values(**g).on_conflict_do_nothing(index_elements=["id"]))

        await session.commit()
        print(f"Seeded {len(USERS)} users and {len(GRANTS) + len(SCHOLARSHIPS)} opportunities.")


if __name__ == "__main__":
    asyncio.run(seed())
