from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.opportunity import Opportunity
from app.models.readiness_assessment import ReadinessAssessment
from app.models.user import User
from app.schemas.readiness import (
    AssessmentQuestion,
    AssessmentResult,
    AssessmentResultSummary,
    CategoryBreakdown,
    FitCriterion,
    OpportunityFitResponse,
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


async def compute_opportunity_fit(
    db: AsyncSession, user_id: str, opportunity_id: str
) -> OpportunityFitResponse:
    user = await db.get(User, user_id)
    if not user:
        raise ValueError(f"User {user_id} not found")

    opp = await db.get(Opportunity, opportunity_id)
    if not opp:
        raise ValueError(f"Opportunity {opportunity_id} not found")

    criteria: list[FitCriterion] = []
    total_weight = 0
    met_weight = 0

    # 1. Field of study match
    field_met = False
    field_partial = False
    user_field = (user.field_of_study or "").lower()
    opp_tags = [t.lower() for t in (opp.field_tags or [])]

    if user_field and opp_tags:
        if user_field in opp_tags:
            field_met = True
        else:
            for tag in opp_tags:
                if user_field in tag or tag in user_field:
                    field_partial = True
                    break

    w = 2
    total_weight += w
    if field_met:
        met_weight += w
    elif field_partial:
        met_weight += w * 0.5

    criteria.append(FitCriterion(
        name="Field of Study",
        required=", ".join(opp.field_tags) if opp.field_tags else "Any",
        user_value=user.field_of_study,
        met=field_met,
        partial=field_partial,
    ))

    # 2. Academic level match
    level_met = False
    level_partial = False
    req_degree = (opp.eligibility_criteria or {}).get("degree", "open") if opp.eligibility_criteria else "open"
    user_level = (user.level or "").lower()

    if req_degree and req_degree != "open" and user_level:
        req_lower = req_degree.lower()
        if user_level in req_lower or req_lower in user_level:
            level_met = True
        elif user_level == "phd" and "phd" in req_lower:
            level_met = True
        else:
            level_partial = True
    elif req_degree == "open":
        level_partial = True

    w = 2
    total_weight += w
    if level_met:
        met_weight += w
    elif level_partial:
        met_weight += w * 0.5

    criteria.append(FitCriterion(
        name="Academic Level",
        required=req_degree if req_degree != "open" else "Open to all",
        user_value=user.level,
        met=level_met,
        partial=level_partial,
    ))

    # 3. Region match
    region_met = False
    user_region = (user.region or "").lower()
    opp_region = (opp.region or "").lower()

    if opp_region == "global":
        region_met = True
    elif user_region and opp_region and user_region == opp_region:
        region_met = True

    w = 2
    total_weight += w
    if region_met:
        met_weight += w

    criteria.append(FitCriterion(
        name="Region",
        required=opp.region or "Global",
        user_value=user.region,
        met=region_met,
    ))

    # 4. Funding needs alignment
    funding_met = False
    funding_partial = False
    if user.funding_needs and opp.eligibility_criteria:
        user_funding_type = user.funding_needs.get("type", "")
        opp_funding_type = opp.eligibility_criteria.get("funding_type", "")
        if user_funding_type and opp_funding_type:
            if user_funding_type.lower() == opp_funding_type.lower():
                funding_met = True
            else:
                funding_partial = True
        else:
            funding_partial = True
    else:
        funding_partial = True

    w = 1
    total_weight += w
    if funding_met:
        met_weight += w
    elif funding_partial:
        met_weight += w * 0.5

    criteria.append(FitCriterion(
        name="Funding Alignment",
        required=(opp.eligibility_criteria or {}).get("funding_type", "Any") if opp.eligibility_criteria else "Any",
        user_value=(user.funding_needs or {}).get("type") if user.funding_needs else None,
        met=funding_met,
        partial=funding_partial,
    ))

    # 5. Past experience relevance
    exp_met = False
    exp_partial = False
    if user.past_projects and opp.field_tags:
        for proj in user.past_projects:
            if isinstance(proj, dict):
                proj_text = " ".join(str(v) for v in proj.values()).lower()
                for tag in opp_tags:
                    if tag in proj_text or proj_text in tag:
                        exp_met = True
                        break
                    for word in proj_text.split():
                        if word in tag or tag in word:
                            exp_partial = True
                if exp_met:
                    break

    w = 1
    total_weight += w
    if exp_met:
        met_weight += w
    elif exp_partial:
        met_weight += w * 0.5

    criteria.append(FitCriterion(
        name="Relevant Experience",
        required="Experience in " + ", ".join(opp.field_tags[:3]) if opp.field_tags else "Any",
        user_value=f"{len(user.past_projects)} project(s)" if user.past_projects else "None listed",
        met=exp_met,
        partial=exp_partial,
    ))

    fit_score = round((met_weight / total_weight) * 100, 1) if total_weight > 0 else 0

    recommendations = []
    if not field_met:
        if field_partial:
            recommendations.append("Your field partially aligns — consider emphasizing transferable skills in your application.")
        else:
            recommendations.append("Your field of study doesn't directly match. Highlight cross-disciplinary relevance.")
    if not level_met:
        if level_partial:
            recommendations.append("Your academic level partially matches. Clarify how your qualifications meet requirements.")
        else:
            recommendations.append("Review the degree requirement — your current level may not meet eligibility.")
    if not region_met:
        recommendations.append("You may not be in the eligible region. Check if exceptions or special categories apply.")
    if not exp_met and not exp_partial:
        recommendations.append("Build relevant project experience to strengthen your fit for this opportunity.")
    if fit_score >= 70:
        recommendations.insert(0, "Strong fit! You're well-positioned for this opportunity.")
    elif fit_score >= 40:
        recommendations.insert(0, "Moderate fit. Address the gaps below to improve your chances.")
    else:
        recommendations.insert(0, "Low fit. Consider opportunities better aligned with your profile.")

    return OpportunityFitResponse(
        user_id=user_id,
        opportunity_id=opportunity_id,
        opportunity_title=opp.title,
        opportunity_provider=opp.provider,
        opportunity_type=opp.type,
        award_range=opp.award_range,
        deadline=opp.deadline.isoformat() if opp.deadline else None,
        region=opp.region,
        field_tags=opp.field_tags,
        fit_score=fit_score,
        criteria=criteria,
        recommendations=recommendations,
    )
