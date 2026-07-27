import sys
import asyncio
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select, update

from app.core.config import settings
from app.models import Application, Project
from app.services.project_graduation import graduate_project


async def mark_won_and_create_project(application_id: str):
    engine = create_async_engine(settings.DATABASE_URL)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with session_factory() as session:
        result = await session.execute(
            select(Application).where(Application.id == application_id)
        )
        app = result.scalar_one_none()

        if not app:
            print(f"Application {application_id} not found")
            return

        if app.status == "won":
            print(f"Application {application_id} is already won")
            existing = await session.execute(
                select(Project).where(Project.source_application_id == application_id)
            )
            proj = existing.scalar_one_none()
            if proj:
                print(f"Project {proj.id} already exists")
            return

        app.status = "won"
        await session.flush()

        project = await graduate_project(session, application_id)
        await session.commit()
        await session.refresh(project)

        print(f"Application {application_id} marked as won")
        print(f"Project created: {project.id}")
        print(f"Milestones: {len(project.milestones)}")
        for m in project.milestones:
            print(f"  - {m['title']}: {m['due_date'][:10]}")
        print(f"Deliverable deadlines: {len(project.deliverable_deadlines)}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m scripts.mark_won <application_id>")
        sys.exit(1)
    asyncio.run(mark_won_and_create_project(sys.argv[1]))
