from pydantic import BaseModel, Field


class AssessmentQuestion(BaseModel):
    id: str
    text: str
    options: list[str]


class AssessmentSubmit(BaseModel):
    user_id: str = Field(default="default-user", description="User ID")
    track: str = Field(..., description="grant | scholarship | research")
    responses: dict[str, str] = Field(..., description="Map of question_id -> answer (yes/no/partial)")


class CategoryBreakdown(BaseModel):
    planning: float
    content: float
    logistics: float
    impact: float


class AssessmentResult(BaseModel):
    id: str
    track: str
    score: float
    breakdown: CategoryBreakdown
    feedback: str
    action_items: list[str]
    responses: dict[str, str]
    completed_at: str | None = None

    model_config = {"from_attributes": True}


class AssessmentResultSummary(BaseModel):
    id: str
    track: str
    score: float
    completed_at: str | None = None

    model_config = {"from_attributes": True}


class FitCriterion(BaseModel):
    name: str
    required: str | None = None
    user_value: str | None = None
    met: bool
    partial: bool = False


class OpportunityFitResponse(BaseModel):
    user_id: str
    opportunity_id: str
    opportunity_title: str
    opportunity_provider: str
    opportunity_type: str | None = None
    award_range: str | None = None
    deadline: str | None = None
    region: str | None = None
    field_tags: list[str] | None = None
    fit_score: float
    criteria: list[FitCriterion]
    recommendations: list[str]
