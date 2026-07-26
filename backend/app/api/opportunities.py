from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.opportunity import MatchResponse, MatchResult
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
