import sys
import asyncio
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.core.config import settings
from app.models import User, ResearchProject

USER_IDS = ["user-001", "user-002"]

RESEARCH_PROJECTS = [
    {
        "id": "rp-001",
        "user_id": "user-001",
        "title": "CRISPR Applications in Tropical Disease Research",
        "notes": {
            "content": "Focus on malaria and dengue applications. Review gene drive mechanisms and vector control strategies.",
            "sections": [
                {"title": "Background", "content": "CRISPR-Cas9 technology has shown promise in controlling disease vectors."},
                {"title": "Objectives", "content": "Evaluate effectiveness of gene drives in mosquito populations."},
            ],
        },
        "citations": [
            {
                "id": "cit-001",
                "paper_id": "paper-001",
                "title": "CRISPR-Cas9 Gene Editing for Malaria Resistance: A Comprehensive Review",
                "authors": ["A. Osei", "K. Mensah", "J. Smith"],
                "year": 2024,
                "journal": "Nature Genetics",
                "volume": "56",
                "issue": "3",
                "pages": "234-251",
                "doi": "10.1038/ng.2024.001",
            },
            {
                "id": "cit-002",
                "paper_id": "paper-011",
                "title": "Genomic Surveillance of Emerging Infectious Diseases: Lessons from COVID-19",
                "authors": ["J. Kim", "A. Osei", "D. Fischer"],
                "year": 2024,
                "journal": "The Lancet Infectious Diseases",
                "volume": "24",
                "issue": "8",
                "pages": "892-905",
                "doi": "10.1016/S1473-3099(24)00456",
            },
        ],
        "linked_application_id": None,
    },
    {
        "id": "rp-002",
        "user_id": "user-001",
        "title": "AI-Driven Genomic Analysis for Personalized Medicine",
        "notes": {
            "content": "Exploring machine learning approaches for genomic data analysis and personalized treatment plans.",
        },
        "citations": [
            {
                "id": "cit-003",
                "paper_id": "paper-018",
                "title": "Federated Learning for Privacy-Preserving Medical Research Across Institutions",
                "authors": ["D. Park", "S. Nakamura", "R. Brown"],
                "year": 2025,
                "journal": "Nature Medicine",
                "volume": "31",
                "issue": "2",
                "pages": "312-325",
                "doi": "10.1038/s41591-025-02345",
            },
        ],
        "linked_application_id": None,
    },
    {
        "id": "rp-003",
        "user_id": "user-002",
        "title": "Digital Democracy and Youth Political Engagement",
        "notes": {
            "content": "Investigating the impact of social media on political participation among young voters in democratic societies.",
            "sections": [
                {"title": "Research Questions", "content": "How does social media influence political engagement? What role do algorithms play?"},
                {"title": "Methodology", "content": "Mixed methods approach combining quantitative surveys with qualitative interviews."},
            ],
        },
        "citations": [
            {
                "id": "cit-004",
                "paper_id": "paper-002",
                "title": "Machine Learning Approaches for Political Sentiment Analysis in Social Media",
                "authors": ["L. Chen", "M. Rodriguez", "S. Kim"],
                "year": 2025,
                "journal": "Journal of Computational Political Science",
                "volume": "12",
                "issue": "1",
                "pages": "45-67",
                "doi": "10.1093/jcps.2025.012",
            },
            {
                "id": "cit-005",
                "paper_id": "paper-013",
                "title": "Digital Democracy: How Social Media Shapes Political Participation in Young Voters",
                "authors": ["M. Rodriguez", "S. Johnson", "A. Patel"],
                "year": 2024,
                "journal": "American Political Science Review",
                "volume": "118",
                "issue": "4",
                "pages": "1567-1584",
                "doi": "10.1017/S0003055424000123",
            },
        ],
        "linked_application_id": None,
    },
    {
        "id": "rp-004",
        "user_id": "user-002",
        "title": "AI Ethics in Political Decision-Making",
        "notes": {
            "content": "Examining ethical frameworks for AI deployment in political analysis and policy recommendations.",
        },
        "citations": [
            {
                "id": "cit-006",
                "paper_id": "paper-010",
                "title": "Artificial Intelligence Ethics in Healthcare: A Cross-Cultural Perspective",
                "authors": ["F. Adeyemi", "K. Sato", "R. Martinez"],
                "year": 2025,
                "journal": "Journal of Medical Ethics",
                "volume": "51",
                "issue": "3",
                "pages": "178-192",
                "doi": "10.1136/jme-2025-109876",
            },
            {
                "id": "cit-007",
                "paper_id": "paper-020",
                "title": "Explainable AI for Legal Decision Support: Balancing Transparency and Accuracy",
                "authors": ["J. Martinez", "C. Williams", "A. Petrov"],
                "year": 2025,
                "journal": "Artificial Intelligence and Law",
                "volume": "33",
                "issue": "1",
                "pages": "67-89",
                "doi": "10.1007/s10506-025-09456",
            },
        ],
        "linked_application_id": None,
    },
]


async def seed_research():
    engine = create_async_engine(settings.DATABASE_URL)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with session_factory() as session:
        for project in RESEARCH_PROJECTS:
            await session.execute(
                pg_insert(ResearchProject)
                .values(**project)
                .on_conflict_do_nothing(index_elements=["id"])
            )

        await session.commit()
        print(f"Seeded {len(RESEARCH_PROJECTS)} research projects with citations.")


if __name__ == "__main__":
    asyncio.run(seed_research())
