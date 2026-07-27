import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func as sql_func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.project import Project
from app.models.application import Application
from app.schemas.project import ProjectResponse, MilestoneUpdate, MilestoneBase

router = APIRouter(prefix="/api/projects", tags=["projects"])


def _calculate_progress(milestones: list[dict] | None) -> float:
    if not milestones:
        return 0.0
    completed = sum(1 for m in milestones if m.get("status") == "completed")
    return round((completed / len(milestones)) * 100, 1)


def _get_next_milestone(milestones: list[dict] | None) -> MilestoneBase | None:
    if not milestones:
        return None
    for m in sorted(milestones, key=lambda x: x["due_date"]):
        if m.get("status") in ("pending", "in_progress"):
            return MilestoneBase(**m)
    return None


def _project_to_response(project: Project) -> ProjectResponse:
    progress = _calculate_progress(project.milestones)
    next_ms = _get_next_milestone(project.milestones)
    return ProjectResponse(
        id=project.id,
        user_id=project.user_id,
        source_application_id=project.source_application_id,
        status=project.status,
        milestones=[MilestoneBase(**m) for m in project.milestones] if project.milestones else None,
        deliverable_deadlines=project.deliverable_deadlines,
        created_at=project.created_at.isoformat() if project.created_at else None,
        updated_at=project.updated_at.isoformat() if project.updated_at else None,
        progress_pct=progress,
        next_milestone=next_ms,
    )


@router.get("", response_model=list[ProjectResponse])
async def list_projects(
    user_id: str = Query(..., description="User ID"),
    status: str | None = Query(None, description="Filter by status: active | completed"),
    db: AsyncSession = Depends(get_db),
):
    query = select(Project).where(Project.user_id == user_id)
    if status:
        query = query.where(Project.status == status)
    query = query.order_by(Project.created_at.desc())
    result = await db.execute(query)
    projects = result.scalars().all()
    return [_project_to_response(p) for p in projects]


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return _project_to_response(project)


@router.put("/{project_id}/milestones/{milestone_id}", response_model=ProjectResponse)
async def update_milestone(
    project_id: str,
    milestone_id: str,
    update: MilestoneUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not project.milestones:
        raise HTTPException(status_code=400, detail="No milestones found")

    updated = False
    for m in project.milestones:
        if m["id"] == milestone_id:
            m["status"] = update.status
            updated = True
            break

    if not updated:
        raise HTTPException(status_code=404, detail="Milestone not found")

    all_completed = all(m["status"] == "completed" for m in project.milestones)
    if all_completed:
        project.status = "completed"

    project.updated_at = datetime.now(timezone.utc)
    await db.flush()
    return _project_to_response(project)


@router.post("/{project_id}/complete", response_model=ProjectResponse)
async def complete_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.status == "completed":
        raise HTTPException(status_code=400, detail="Project already completed")

    for m in project.milestones:
        m["status"] = "completed"

    project.status = "completed"
    project.updated_at = datetime.now(timezone.utc)
    await db.flush()
    return _project_to_response(project)
