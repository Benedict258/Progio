from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.application import Application
from app.models.opportunity import Opportunity
from app.models.user import User
from app.schemas.application import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationUpdate,
    GenerateSectionRequest,
)
from app.services.ai_generator import TRACK_PROMPTS, generate_section_stream
from app.services.project_graduation import graduate_project
from app.api.projects import _project_to_response
from app.schemas.project import ProjectResponse

router = APIRouter(prefix="/api/applications", tags=["applications"])


def _app_to_response(app: Application) -> ApplicationResponse:
    return ApplicationResponse(
        id=app.id,
        user_id=app.user_id,
        opportunity_id=app.opportunity_id,
        type=app.type,
        status=app.status,
        sections=app.sections,
        version_history=app.version_history,
        created_at=app.created_at.isoformat() if app.created_at else None,
        updated_at=app.updated_at.isoformat() if app.updated_at else None,
    )


@router.post("", response_model=ApplicationResponse, status_code=201)
async def create_application(
    payload: ApplicationCreate,
    db: AsyncSession = Depends(get_db),
):
    app = Application(
        user_id=payload.user_id,
        opportunity_id=payload.opportunity_id,
        type=payload.type,
        sections=payload.sections or {},
        version_history=[],
    )
    db.add(app)
    await db.commit()
    await db.refresh(app)
    return _app_to_response(app)


@router.get("/{app_id}", response_model=ApplicationResponse)
async def get_application(
    app_id: str,
    db: AsyncSession = Depends(get_db),
):
    app = await db.get(Application, app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return _app_to_response(app)


@router.patch("/{app_id}", response_model=ApplicationResponse)
async def update_application(
    app_id: str,
    payload: ApplicationUpdate,
    db: AsyncSession = Depends(get_db),
):
    app = await db.get(Application, app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if payload.status is not None:
        app.status = payload.status
    if payload.sections is not None:
        if app.version_history is None:
            app.version_history = []
        app.version_history.append({"sections": app.sections, "status": app.status})
        app.sections = payload.sections

    await db.commit()
    await db.refresh(app)
    return _app_to_response(app)


@router.post("/{app_id}/generate-section")
async def generate_section(
    app_id: str,
    payload: GenerateSectionRequest,
    db: AsyncSession = Depends(get_db),
):
    if payload.track_type not in TRACK_PROMPTS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid track_type '{payload.track_type}'. Must be grant, scholarship, or research.",
        )
    if payload.section_type not in TRACK_PROMPTS[payload.track_type]:
        available = list(TRACK_PROMPTS[payload.track_type].keys())
        raise HTTPException(
            status_code=400,
            detail=f"Invalid section_type '{payload.section_type}' for track '{payload.track_type}'. "
            f"Available: {available}",
        )

    app_obj = await db.get(Application, app_id)
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")

    user = await db.get(User, app_obj.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    opportunity = await db.get(Opportunity, app_obj.opportunity_id)
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    context = {
        "title": opportunity.title,
        "provider": opportunity.provider,
        "field": user.field_of_study or "interdisciplinary studies",
        "institution": user.institution or "their institution",
        "level": user.level or "graduate student",
        "region": user.region or "global",
        "user_name": user.name or "the applicant",
        "past_projects": ", ".join(
            p["title"] for p in (user.past_projects or []) if isinstance(p, dict) and "title" in p
        ) or "no specific projects listed",
        "past_projects_raw": user.past_projects or [],
        "funding_needs": str(user.funding_needs) if user.funding_needs else "standard funding",
        "award_range": opportunity.award_range or "competitive award",
        "deadline": opportunity.deadline.isoformat() if opportunity.deadline else "TBD",
        "eligibility_criteria": opportunity.eligibility_criteria or {},
        "field_tags": opportunity.field_tags or [],
        "source_url": opportunity.source_url or "",
    }

    return StreamingResponse(
        generate_section_stream(payload.section_type, payload.track_type, context),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/{application_id}/mark-won", response_model=ProjectResponse)
async def mark_application_won(
    application_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Application).where(Application.id == application_id))
    application = result.scalar_one_or_none()

    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    if application.status == "won":
        raise HTTPException(status_code=400, detail="Application is already marked as won")

    application.status = "won"
    await db.flush()

    try:
        project = await graduate_project(db, application_id)
    except ValueError as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

    await db.commit()
    await db.refresh(project)

    return _project_to_response(project)
