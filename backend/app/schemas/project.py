from pydantic import BaseModel, Field
from datetime import datetime


class MilestoneBase(BaseModel):
    id: str
    title: str
    due_date: str
    status: str = "pending"  # pending | in_progress | completed
    description: str | None = None


class ProjectCreate(BaseModel):
    user_id: str
    source_application_id: str | None = None
    milestones: list[MilestoneBase] | None = None
    deliverable_deadlines: list[dict] | None = None


class MilestoneUpdate(BaseModel):
    status: str = Field(..., description="pending | in_progress | completed")


class ProjectResponse(BaseModel):
    id: str
    user_id: str
    source_application_id: str | None = None
    status: str
    milestones: list[MilestoneBase] | None = None
    deliverable_deadlines: list[dict] | None = None
    created_at: str | None = None
    updated_at: str | None = None
    progress_pct: float | None = None
    next_milestone: MilestoneBase | None = None

    model_config = {"from_attributes": True}
