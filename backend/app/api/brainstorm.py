from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.application import Application
from app.models.opportunity import Opportunity
from app.models.user import User
from app.schemas.brainstorm import (
    BrainstormFreeformRequest,
    BrainstormOpportunityRequest,
    SaveDraftRequest,
)
from app.services.brainstorm import (
    generate_freeform_blueprint,
    generate_opportunity_concepts,
    stream_blueprint,
    stream_concepts,
)
from app.services.matching import compute_matches

router = APIRouter(prefix="/api/ai/brainstorm", tags=["brainstorm"])


@router.post("/opportunity")
async def brainstorm_opportunity(
    payload: BrainstormOpportunityRequest,
    db: AsyncSession = Depends(get_db),
):
    """Generate 3 tailored proposal concepts from an opportunity via SSE."""
    user = await db.get(User, payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    opportunity = await db.get(Opportunity, payload.opportunity_id)
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    concepts = generate_opportunity_concepts(user, opportunity, opportunity.type)

    return StreamingResponse(
        stream_concepts(concepts, opportunity.id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/freeform")
async def brainstorm_freeform(
    payload: BrainstormFreeformRequest,
    db: AsyncSession = Depends(get_db),
):
    """Generate a structured proposal blueprint from a raw idea via SSE."""
    user = await db.get(User, payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    blueprint = generate_freeform_blueprint(user, payload.idea_text)

    return StreamingResponse(
        stream_blueprint(blueprint),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/save-draft")
async def save_draft(
    payload: SaveDraftRequest,
    db: AsyncSession = Depends(get_db),
):
    """Save brainstorm result as an application record."""
    user = await db.get(User, payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.opportunity_id:
        opp = await db.get(Opportunity, payload.opportunity_id)
        if not opp:
            raise HTTPException(status_code=404, detail="Opportunity not found")
        opp_id = payload.opportunity_id
        opp_type = opp.type
    else:
        opp_id = payload.opportunity_id or "unlinked"
        opp_type = payload.type

    app = Application(
        user_id=payload.user_id,
        opportunity_id=opp_id,
        type=opp_type,
        sections=payload.sections,
        status="draft",
        version_history=[],
    )
    db.add(app)
    await db.commit()
    await db.refresh(app)

    return {
        "id": app.id,
        "user_id": app.user_id,
        "opportunity_id": app.opportunity_id,
        "type": app.type,
        "status": app.status,
        "sections": app.sections,
        "created_at": app.created_at.isoformat() if app.created_at else None,
    }
