from pydantic import BaseModel, Field
from fastapi import APIRouter, UploadFile, File

from app.services.template_parser import parse_template, ParsedTemplate

router = APIRouter(prefix="/api/opportunities", tags=["template-parser"])


class TemplateParseRequest(BaseModel):
    url: str = Field(..., min_length=5, description="URL of the donor template")


@router.post("/parse-template", response_model=ParsedTemplate)
async def parse_template_url(payload: TemplateParseRequest):
    return parse_template(payload.url, source_type="url")


@router.post("/parse-template-file", response_model=ParsedTemplate)
async def parse_template_upload(file: UploadFile = File(...)):
    filename = file.filename or "uploaded-file"
    return parse_template(filename, source_type="file", filename=filename)
