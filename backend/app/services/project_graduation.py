import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.application import Application
from app.models.project import Project


def _generate_milestones(created_at: datetime) -> list[dict]:
    milestones = [
        {
            "id": str(uuid.uuid4()),
            "title": "Project Kickoff",
            "due_date": (created_at + timedelta(weeks=1)).isoformat(),
            "status": "pending",
            "description": "Initial project setup, team introduction, and scope confirmation",
        },
        {
            "id": str(uuid.uuid4()),
            "title": "First Progress Report",
            "due_date": (created_at + timedelta(days=60)).isoformat(),
            "status": "pending",
            "description": "Submit first progress report covering initial milestones achieved",
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Mid-term Review",
            "due_date": (created_at + timedelta(days=180)).isoformat(),
            "status": "pending",
            "description": "Comprehensive mid-term review of project progress and deliverables",
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Final Report Submission",
            "due_date": (created_at + timedelta(days=365)).isoformat(),
            "status": "pending",
            "description": "Submit final project report with all deliverables and outcomes",
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Project Closure",
            "due_date": (created_at + timedelta(days=395)).isoformat(),
            "status": "pending",
            "description": "Final project closure, knowledge transfer, and documentation",
        },
    ]
    return milestones


def _generate_deliverable_deadlines(milestones: list[dict]) -> list[dict]:
    deadlines = []
    for m in milestones:
        deadlines.append(
            {
                "milestone_id": m["id"],
                "title": m["title"],
                "due_date": m["due_date"],
                "status": "pending",
            }
        )
    return deadlines


async def graduate_project(
    db: AsyncSession, application_id: str
) -> Project:
    result = await db.execute(select(Application).where(Application.id == application_id))
    application = result.scalar_one_or_none()

    if not application:
        raise ValueError(f"Application {application_id} not found")

    if application.status != "won":
        raise ValueError(f"Application {application_id} is not won")

    existing = await db.execute(
        select(Project).where(Project.source_application_id == application_id)
    )
    if existing.scalar_one_or_none():
        raise ValueError(f"Project already exists for application {application_id}")

    now = datetime.now(timezone.utc)
    milestones = _generate_milestones(now)
    deliverable_deadlines = _generate_deliverable_deadlines(milestones)

    project = Project(
        id=str(uuid.uuid4()),
        user_id=application.user_id,
        source_application_id=application_id,
        status="active",
        milestones=milestones,
        deliverable_deadlines=deliverable_deadlines,
        created_at=now,
        updated_at=now,
    )

    db.add(project)
    await db.flush()

    return project
