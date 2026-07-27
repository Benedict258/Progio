from pydantic import BaseModel, Field
from datetime import datetime


class PaperSearchRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Search query for literature discovery")


class PaperResponse(BaseModel):
    id: str
    title: str
    authors: list[str]
    abstract: str
    year: int
    journal: str
    keywords: list[str]
    doi: str | None = None
    relevance_score: float | None = None


class ResearchProjectCreate(BaseModel):
    user_id: str
    title: str = Field(..., min_length=1, max_length=500)
    linked_application_id: str | None = None


class ResearchProjectResponse(BaseModel):
    id: str
    user_id: str
    title: str
    notes: dict | None = None
    citations: list[dict] | None = None
    linked_application_id: str | None = None
    created_at: str | None = None
    updated_at: str | None = None

    model_config = {"from_attributes": True}


class CitationCreate(BaseModel):
    paper_id: str | None = None
    title: str
    authors: list[str]
    year: int
    journal: str
    volume: str | None = None
    issue: str | None = None
    pages: str | None = None
    doi: str | None = None


class CitationResponse(BaseModel):
    id: str
    paper_id: str | None = None
    title: str
    authors: list[str]
    year: int
    journal: str
    volume: str | None = None
    issue: str | None = None
    pages: str | None = None
    doi: str | None = None
    formatted_apa: str | None = None
    formatted_mla: str | None = None
    formatted_ieee: str | None = None


class CitationFormatRequest(BaseModel):
    citation: CitationCreate
    style: str = Field(..., pattern="^(APA|MLA|IEEE)$", description="Citation format style")


class CitationFormatResponse(BaseModel):
    formatted: str
    style: str
