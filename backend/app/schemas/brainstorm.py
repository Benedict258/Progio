from pydantic import BaseModel, Field


class BrainstormOpportunityRequest(BaseModel):
    opportunity_id: str
    user_id: str


class BrainstormFreeformRequest(BaseModel):
    idea_text: str = Field(..., min_length=10, description="Raw idea text from user")
    user_id: str


class ProposalConcept(BaseModel):
    title: str
    problem_statement: str
    methodology: str
    expected_impact: str
    fit_score: float = Field(..., ge=0, le=100)


class BrainstormConceptsResponse(BaseModel):
    concepts: list[ProposalConcept]
    opportunity_id: str | None = None


class BlueprintSection(BaseModel):
    objectives: str
    significance: str
    methodology: str
    expected_impact: str


class BrainstormBlueprintResponse(BaseModel):
    blueprint: BlueprintSection
    matched_opportunities: list[dict] | None = None


class SaveDraftRequest(BaseModel):
    user_id: str
    opportunity_id: str | None = None
    type: str = Field(default="grant", description="grant | scholarship | research")
    sections: dict = Field(default_factory=dict)
