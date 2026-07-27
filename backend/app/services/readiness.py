from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.readiness_assessment import ReadinessAssessment
from app.schemas.readiness import (
    AssessmentQuestion,
    AssessmentResult,
    AssessmentResultSummary,
    CategoryBreakdown,
)

QUESTIONNAIRES: dict[str, list[dict]] = {
    "grant": [
        {"id": "g1", "text": "Do you have a clearly defined research question?", "options": ["yes", "no", "partial"]},
        {"id": "g2", "text": "Have you identified a specific funding agency?", "options": ["yes", "no"]},
        {"id": "g3", "text": "Can you articulate your methodology?", "options": ["yes", "no", "partial"]},
        {"id": "g4", "text": "Do you have institutional support letters?", "options": ["yes", "no"]},
        {"id": "g5", "text": "Have you budgeted for all project costs?", "options": ["yes", "no", "partial"]},
        {"id": "g6", "text": "Is your timeline realistic?", "options": ["yes", "no", "partial"]},
        {"id": "g7", "text": "Does your project align with SDGs?", "options": ["yes", "no", "partial"]},
        {"id": "g8", "text": "Have you reviewed similar successful proposals?", "options": ["yes", "no"]},
    ],
    "scholarship": [
        {"id": "s1", "text": "Can you articulate your academic goals?", "options": ["yes", "no", "partial"]},
        {"id": "s2", "text": "Do you have strong recommendation letters arranged?", "options": ["yes", "no"]},
        {"id": "s3", "text": "Have you demonstrated leadership experience?", "options": ["yes", "no", "partial"]},
        {"id": "s4", "text": "Is your personal statement compelling?", "options": ["yes", "no", "partial"]},
        {"id": "s5", "text": "Do you meet all eligibility criteria?", "options": ["yes", "no"]},
        {"id": "s6", "text": "Have you prepared your transcripts?", "options": ["yes", "no"]},
        {"id": "s7", "text": "Can you demonstrate financial need?", "options": ["yes", "no", "partial"]},
        {"id": "s8", "text": "Have you researched the institution?", "options": ["yes", "no"]},
    ],
    "research": [
        {"id": "r1", "text": "Is your hypothesis clearly stated?", "options": ["yes", "no", "partial"]},
        {"id": "r2", "text": "Have you reviewed relevant literature?", "options": ["yes", "no"]},
        {"id": "r3", "text": "Is your methodology sound?", "options": ["yes", "no", "partial"]},
        {"id": "r4", "text": "Do you have access to necessary resources?", "options": ["yes", "no"]},
        {"id": "r5", "text": "Is your timeline feasible?", "options": ["yes", "no", "partial"]},
        {"id": "r6", "text": "Have you considered ethical implications?", "options": ["yes", "no", "partial"]},
        {"id": "r7", "text": "Do you have a data management plan?", "options": ["yes", "no"]},
        {"id": "r8", "text": "Can you articulate expected outcomes?", "options": ["yes", "no", "partial"]},
    ],
}

SCORE_MAP = {"yes": 10, "partial": 5, "no": 0}

CATEGORY_LABELS = {
    "planning": "Planning",
    "content": "Content",
    "logistics": "Logistics",
    "impact": "Impact",
}

CATEGORY_QUESTIONS = {
    "grant": {
        "planning": ["g1", "g2"],
        "content": ["g3", "g4"],
        "logistics": ["g5", "g6"],
        "impact": ["g7", "g8"],
    },
    "scholarship": {
        "planning": ["s1", "s2"],
        "content": ["s3", "s4"],
        "logistics": ["s5", "s6"],
        "impact": ["s7", "s8"],
    },
    "research": {
        "planning": ["r1", "r2"],
        "content": ["r3", "r4"],
        "logistics": ["r5", "r6"],
        "impact": ["r7", "r8"],
    },
}

FEEDBACK_TEMPLATES = {
    "planning": {
        "weak": "Your planning needs improvement. Focus on clearly defining your research question and identifying the right funding opportunities.",
        "medium": "Your planning is on track but could be stronger. Consider refining your core question and target agencies.",
        "strong": "Excellent planning foundation. Your research question and funding targets are well-defined.",
    },
    "content": {
        "weak": "Strengthen your content by developing a clearer methodology and securing institutional support.",
        "medium": "Your content is solid. Consider bolstering your methodology and support documentation.",
        "strong": "Strong content area. Your methodology and institutional backing are compelling.",
    },
    "logistics": {
        "weak": "Address logistical gaps by finalizing your budget and creating a realistic timeline.",
        "medium": "Logistics are mostly in order. Review your budget completeness and timeline feasibility.",
        "strong": "Well-prepared logistically. Your budget and timeline are thorough and realistic.",
    },
    "impact": {
        "weak": "Enhance your impact narrative by aligning with SDGs and studying successful proposals.",
        "medium": "Good impact potential. Strengthen SDG alignment and review peer successes.",
        "strong": "Excellent impact positioning. Your project alignment and research are compelling.",
    },
}


def get_questions(track: str) -> list[AssessmentQuestion]:
    questions = QUESTIONNAIRES.get(track, [])
    return [AssessmentQuestion(id=q["id"], text=q["text"], options=q["options"]) for q in questions]


def _compute_category_score(track: str, category: str, responses: dict[str, str]) -> float:
    q_ids = CATEGORY_QUESTIONS[track][category]
    total = sum(SCORE_MAP.get(responses.get(qid, "no"), 0) for qid in q_ids)
    max_pts = len(q_ids) * 10
    return round((total / max_pts) * 100, 1) if max_pts else 0


def _score_to_level(score: float) -> str:
    if score >= 70:
        return "strong"
    if score >= 40:
        return "medium"
    return "weak"


def compute_assessment(track: str, responses: dict[str, str]) -> tuple[float, CategoryBreakdown, str, list[str]]:
    total_points = sum(SCORE_MAP.get(ans, 0) for ans in responses.values())
    max_points = len(QUESTIONNAIRES[track]) * 10
    overall = round((total_points / max_points) * 100, 1)

    breakdown = CategoryBreakdown(
        planning=_compute_category_score(track, "planning", responses),
        content=_compute_category_score(track, "content", responses),
        logistics=_compute_category_score(track, "logistics", responses),
        impact=_compute_category_score(track, "impact", responses),
    )

    feedback_parts = []
    action_items = []
    for cat_key, cat_label in CATEGORY_LABELS.items():
        cat_score = getattr(breakdown, cat_key)
        level = _score_to_level(cat_score)
        feedback_parts.append(f"{cat_label}: {FEEDBACK_TEMPLATES[cat_key][level]}")
        if level != "strong":
            action_items.append(f"Improve your {cat_label.lower()} area ({cat_score:.0f}%)")

    if overall >= 80:
        feedback_parts.insert(0, "You are well-prepared! Focus on polishing your application.")
    elif overall >= 50:
        feedback_parts.insert(0, "You have a solid foundation. Address the weak areas to strengthen your application.")
    else:
        feedback_parts.insert(0, "Significant preparation needed. Work through the action items systematically.")

    if not action_items:
        action_items.append("Great job! Consider doing a final review of all materials.")

    return overall, breakdown, " ".join(feedback_parts), action_items


async def submit_assessment(
    db: AsyncSession, user_id: str, track: str, responses: dict[str, str]
) -> AssessmentResult:
    score, breakdown, feedback, action_items = compute_assessment(track, responses)

    assessment = ReadinessAssessment(
        user_id=user_id,
        track=track,
        score=score,
        responses=responses,
        completed_at=datetime.now(timezone.utc),
    )
    db.add(assessment)
    await db.commit()
    await db.refresh(assessment)

    return AssessmentResult(
        id=assessment.id,
        track=track,
        score=score,
        breakdown=breakdown,
        feedback=feedback,
        action_items=action_items,
        responses=responses,
        completed_at=assessment.completed_at.isoformat() if assessment.completed_at else None,
    )


async def get_user_results(db: AsyncSession, user_id: str) -> list[AssessmentResultSummary]:
    result = await db.execute(
        select(ReadinessAssessment)
        .where(ReadinessAssessment.user_id == user_id)
        .order_by(ReadinessAssessment.created_at.desc())
    )
    rows = result.scalars().all()
    return [
        AssessmentResultSummary(
            id=r.id,
            track=r.track,
            score=r.score,
            completed_at=r.completed_at.isoformat() if r.completed_at else None,
        )
        for r in rows
    ]


async def get_user_track_result(
    db: AsyncSession, user_id: str, track: str
) -> AssessmentResult | None:
    result = await db.execute(
        select(ReadinessAssessment)
        .where(ReadinessAssessment.user_id == user_id, ReadinessAssessment.track == track)
        .order_by(ReadinessAssessment.created_at.desc())
        .limit(1)
    )
    row = result.scalar_one_or_none()
    if not row:
        return None

    responses = row.responses or {}
    _, breakdown, feedback, action_items = compute_assessment(track, responses)

    return AssessmentResult(
        id=row.id,
        track=row.track,
        score=row.score,
        breakdown=breakdown,
        feedback=feedback,
        action_items=action_items,
        responses=responses,
        completed_at=row.completed_at.isoformat() if row.completed_at else None,
    )
