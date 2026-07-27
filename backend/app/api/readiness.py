from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.readiness import (
    AssessmentQuestion,
    AssessmentResult,
    AssessmentResultSummary,
    AssessmentSubmit,
)
from app.services.readiness import (
    QUESTIONNAIRES,
    get_questions,
    get_user_results,
    get_user_track_result,
    submit_assessment,
)

router = APIRouter(prefix="/api/readiness", tags=["readiness"])


@router.get("/questions/{track}", response_model=list[AssessmentQuestion])
async def get_readiness_questions(track: str):
    if track not in QUESTIONNAIRES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid track '{track}'. Must be grant, scholarship, or research.",
        )
    return get_questions(track)


@router.post("/submit", response_model=AssessmentResult, status_code=201)
async def submit_readiness_assessment(
    payload: AssessmentSubmit,
    db: AsyncSession = Depends(get_db),
):
    if payload.track not in QUESTIONNAIRES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid track '{payload.track}'. Must be grant, scholarship, or research.",
        )
    valid_ids = {q["id"] for q in QUESTIONNAIRES[payload.track]}
    for qid in payload.responses:
        if qid not in valid_ids:
            raise HTTPException(status_code=400, detail=f"Invalid question id '{qid}' for track '{payload.track}'")
    for qid, ans in payload.responses.items():
        if ans not in ("yes", "no", "partial"):
            raise HTTPException(status_code=400, detail=f"Invalid answer '{ans}' for question '{qid}'. Must be yes/no/partial")

    return await submit_assessment(db, payload.user_id, payload.track, payload.responses)


@router.get("/results/{user_id}", response_model=list[AssessmentResultSummary])
async def get_results_for_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
):
    return await get_user_results(db, user_id)


@router.get("/results/{user_id}/{track}", response_model=AssessmentResult)
async def get_result_for_track(
    user_id: str,
    track: str,
    db: AsyncSession = Depends(get_db),
):
    if track not in QUESTIONNAIRES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid track '{track}'. Must be grant, scholarship, or research.",
        )
    result = await get_user_track_result(db, user_id, track)
    if not result:
        raise HTTPException(status_code=404, detail="No assessment found for this user and track")
    return result
