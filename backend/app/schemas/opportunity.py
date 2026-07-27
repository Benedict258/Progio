from pydantic import BaseModel


class MatchResult(BaseModel):
    opportunity_id: str
    score: float
    match_reasons: list[str]


class MatchResponse(BaseModel):
    matches: list[MatchResult]


class EnrichedMatch(BaseModel):
    opportunity_id: str
    title: str
    provider: str
    score: float
    match_reasons: list[str]
    award_range: str | None = None
    deadline: str | None = None
    type: str | None = None


class EnrichedMatchResponse(BaseModel):
    matches: list[EnrichedMatch]


class OpportunityResponse(BaseModel):
    id: str
    type: str
    title: str
    provider: str
    eligibility_criteria: dict | None = None
    award_range: str | None = None
    deadline: str | None = None
    field_tags: list[str] | None = None
    region: str | None = None
    source_url: str | None = None
