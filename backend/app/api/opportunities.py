from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.opportunity import Opportunity
from app.schemas.opportunity import EnrichedMatch, EnrichedMatchResponse, MatchResponse, MatchResult
from app.services.matching import compute_matches

router = APIRouter(prefix="/api/opportunities", tags=["opportunities"])


@router.get("/matches", response_model=MatchResponse)
async def get_matches(
    user_id: str = Query(..., description="User ID to match against"),
    type: str | None = Query(None, description="Filter by type: grant or scholarship"),
    db: AsyncSession = Depends(get_db),
):
    try:
        results = await compute_matches(db, user_id, opp_type=type)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    matches = [
        MatchResult(
            opportunity_id=r["opportunity_id"],
            score=r["score"],
            match_reasons=r["match_reasons"],
        )
        for r in results
    ]
    return MatchResponse(matches=matches)


@router.get("/matches-enriched", response_model=EnrichedMatchResponse)
async def get_matches_enriched(
    user_id: str = Query(..., description="User ID to match against"),
    type: str | None = Query(None, description="Filter by type: grant or scholarship"),
    db: AsyncSession = Depends(get_db),
):
    try:
        results = await compute_matches(db, user_id, opp_type=type)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    opp_ids = [r["opportunity_id"] for r in results]
    if not opp_ids:
        return EnrichedMatchResponse(matches=[])

    opp_result = await db.execute(select(Opportunity).where(Opportunity.id.in_(opp_ids)))
    opps = {o.id: o for o in opp_result.scalars().all()}

    enriched = []
    for r in results:
        opp = opps.get(r["opportunity_id"])
        if opp:
            enriched.append(EnrichedMatch(
                opportunity_id=r["opportunity_id"],
                title=opp.title,
                provider=opp.provider,
                score=r["score"],
                match_reasons=r["match_reasons"],
                award_range=opp.award_range,
                deadline=opp.deadline.isoformat() if opp.deadline else None,
                type=opp.type,
            ))

    return EnrichedMatchResponse(matches=enriched)
