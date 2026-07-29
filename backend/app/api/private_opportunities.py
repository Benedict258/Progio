from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.private_opportunity import PrivateOpportunity
from app.schemas.private_opportunity import (
    ParseExternalRequest,
    ParseExternalResponse,
    PrivateOpportunityCreate,
    PrivateOpportunityResponse,
    PrivateOpportunityUpdate,
)
from app.services.parse_external import parse_name, parse_url

router = APIRouter(prefix="/api/opportunities/private", tags=["private-opportunities"])


def _opp_to_response(opp: PrivateOpportunity) -> PrivateOpportunityResponse:
    return PrivateOpportunityResponse(
        id=opp.id,
        user_id=opp.user_id,
        type=opp.type,
        title=opp.title,
        provider=opp.provider,
        description=opp.description,
        eligibility_criteria=opp.eligibility_criteria,
        award_range=opp.award_range,
        deadline=opp.deadline.isoformat() if opp.deadline else None,
        field_tags=opp.field_tags,
        region=opp.region,
        source_url=opp.source_url,
        guidelines=opp.guidelines,
        is_parsed=opp.is_parsed,
        created_at=opp.created_at.isoformat() if opp.created_at else None,
        updated_at=opp.updated_at.isoformat() if opp.updated_at else None,
    )


@router.post("", response_model=PrivateOpportunityResponse, status_code=201)
async def create_private_opportunity(
    payload: PrivateOpportunityCreate,
    db: AsyncSession = Depends(get_db),
):
    if not payload.title or not payload.title.strip():
        raise HTTPException(status_code=422, detail="Title is required")
    if not payload.provider or not payload.provider.strip():
        raise HTTPException(status_code=422, detail="Provider is required")
    if payload.type not in ("grant", "scholarship"):
        raise HTTPException(status_code=422, detail="Type must be 'grant' or 'scholarship'")

    deadline_date = None
    if payload.deadline:
        try:
            deadline_date = date.fromisoformat(payload.deadline)
        except ValueError:
            raise HTTPException(status_code=422, detail="Invalid deadline format. Use YYYY-MM-DD")

    opp = PrivateOpportunity(
        user_id=payload.user_id,
        type=payload.type,
        title=payload.title.strip(),
        provider=payload.provider.strip(),
        description=payload.description,
        eligibility_criteria=payload.eligibility_criteria,
        award_range=payload.award_range,
        deadline=deadline_date,
        field_tags=payload.field_tags,
        region=payload.region,
        source_url=payload.source_url,
        guidelines=payload.guidelines,
        is_parsed=payload.is_parsed,
    )
    db.add(opp)
    await db.commit()
    await db.refresh(opp)
    return _opp_to_response(opp)


@router.get("", response_model=list[PrivateOpportunityResponse])
async def list_private_opportunities(
    user_id: str = Query(..., description="User ID"),
    type: str | None = Query(None, description="Filter by type: grant | scholarship"),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(PrivateOpportunity).where(PrivateOpportunity.user_id == user_id)
    if type:
        stmt = stmt.where(PrivateOpportunity.type == type)
    stmt = stmt.order_by(PrivateOpportunity.created_at.desc())
    result = await db.execute(stmt)
    opps = result.scalars().all()
    return [_opp_to_response(o) for o in opps]


@router.get("/{opp_id}", response_model=PrivateOpportunityResponse)
async def get_private_opportunity(
    opp_id: str,
    db: AsyncSession = Depends(get_db),
):
    opp = await db.get(PrivateOpportunity, opp_id)
    if not opp:
        raise HTTPException(status_code=404, detail="Private opportunity not found")
    return _opp_to_response(opp)


@router.put("/{opp_id}", response_model=PrivateOpportunityResponse)
async def update_private_opportunity(
    opp_id: str,
    payload: PrivateOpportunityUpdate,
    db: AsyncSession = Depends(get_db),
):
    opp = await db.get(PrivateOpportunity, opp_id)
    if not opp:
        raise HTTPException(status_code=404, detail="Private opportunity not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "deadline" in update_data and update_data["deadline"] is not None:
        try:
            opp.deadline = date.fromisoformat(update_data["deadline"])
        except ValueError:
            pass
        del update_data["deadline"]

    for field, value in update_data.items():
        setattr(opp, field, value)

    await db.commit()
    await db.refresh(opp)
    return _opp_to_response(opp)


@router.delete("/{opp_id}", status_code=204)
async def delete_private_opportunity(
    opp_id: str,
    db: AsyncSession = Depends(get_db),
):
    opp = await db.get(PrivateOpportunity, opp_id)
    if not opp:
        raise HTTPException(status_code=404, detail="Private opportunity not found")
    await db.delete(opp)
    await db.commit()


parse_router = APIRouter(prefix="/api/opportunities", tags=["parse-external"])


@parse_router.post("/parse-external", response_model=ParseExternalResponse)
async def parse_external_opportunity(
    payload: ParseExternalRequest,
    db: AsyncSession = Depends(get_db),
):
    if not payload.url and not payload.name:
        raise HTTPException(status_code=400, detail="URL or name is required")

    if payload.name and not payload.url:
        result = await parse_name(payload.name, payload.type)
    else:
        result = await parse_url(payload.url, payload.type)
    return ParseExternalResponse(**result)
