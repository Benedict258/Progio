from datetime import datetime

from pydantic import BaseModel, Field
from typing import Optional


class ProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    institution: Optional[str] = Field(None, max_length=255)
    field_of_study: Optional[str] = Field(None, max_length=255)
    level: Optional[str] = Field(None, max_length=50)
    region: Optional[str] = Field(None, max_length=100)
    funding_needs: Optional[dict] = None
    past_projects: Optional[list] = None


class ProfileResponse(BaseModel):
    id: str
    name: str
    email: str
    institution: Optional[str] = None
    field_of_study: Optional[str] = None
    level: Optional[str] = None
    region: Optional[str] = None
    funding_needs: Optional[dict] = None
    past_projects: Optional[list] = None
    profile_completion_pct: float
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class AIFillResponse(BaseModel):
    institution: Optional[str] = None
    field_of_study: Optional[str] = None
    level: Optional[str] = None
    region: Optional[str] = None
    funding_needs: Optional[dict] = None
    past_projects: Optional[list] = None
    raw_text_preview: str = ""
    confidence: dict = Field(default_factory=dict)
