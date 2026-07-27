from pydantic import BaseModel, Field


class GenerateSectionRequest(BaseModel):
    section_type: str = Field(..., description="Section key to generate (e.g. technical_approach)")
    track_type: str = Field(..., description="Track type: grant | scholarship | research")


class ApplicationCreate(BaseModel):
    user_id: str
    opportunity_id: str
    type: str = Field(..., description="grant | scholarship | research")
    sections: dict | None = None


class ApplicationUpdate(BaseModel):
    status: str | None = None
    sections: dict | None = None


class ApplicationResponse(BaseModel):
    id: str
    user_id: str
    opportunity_id: str
    type: str
    status: str
    sections: dict | None = None
    version_history: list | None = None
    created_at: str | None = None
    updated_at: str | None = None

    model_config = {"from_attributes": True}
