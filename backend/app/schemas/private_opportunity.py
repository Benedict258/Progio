from pydantic import BaseModel, Field


class PrivateOpportunityCreate(BaseModel):
    user_id: str
    type: str = Field(..., description="grant | scholarship")
    title: str
    provider: str
    description: str | None = None
    eligibility_criteria: dict | None = None
    award_range: str | None = None
    deadline: str | None = None
    field_tags: list[str] | None = None
    region: str | None = None
    source_url: str | None = None
    guidelines: str | None = None
    is_parsed: bool = False


class PrivateOpportunityUpdate(BaseModel):
    title: str | None = None
    provider: str | None = None
    description: str | None = None
    eligibility_criteria: dict | None = None
    award_range: str | None = None
    deadline: str | None = None
    field_tags: list[str] | None = None
    region: str | None = None
    source_url: str | None = None
    guidelines: str | None = None


class PrivateOpportunityResponse(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    provider: str
    description: str | None = None
    eligibility_criteria: dict | None = None
    award_range: str | None = None
    deadline: str | None = None
    field_tags: list[str] | None = None
    region: str | None = None
    source_url: str | None = None
    guidelines: str | None = None
    is_parsed: bool = False
    created_at: str | None = None
    updated_at: str | None = None

    model_config = {"from_attributes": True}


class ParseExternalRequest(BaseModel):
    url: str | None = None
    name: str | None = None
    type: str = Field(default="grant", description="grant | scholarship")


class ParseExternalResponse(BaseModel):
    title: str | None = None
    provider: str | None = None
    description: str | None = None
    deadline: str | None = None
    award_range: str | None = None
    eligibility_criteria: dict | None = None
    field_tags: list[str] | None = None
    region: str | None = None
    source_url: str | None = None
