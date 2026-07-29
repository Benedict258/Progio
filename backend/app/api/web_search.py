from pydantic import BaseModel, Field
from fastapi import APIRouter

from app.services.web_search import search_web

router = APIRouter(prefix="/api/ai", tags=["web-search"])


class WebSearchRequest(BaseModel):
    query: str = Field(..., min_length=2, description="Search query string")


class SearchResult(BaseModel):
    title: str
    url: str
    snippet: str
    source: str


class WebSearchResponse(BaseModel):
    results: list[SearchResult]


@router.post("/web-search", response_model=WebSearchResponse)
async def web_search(payload: WebSearchRequest):
    results = search_web(payload.query)
    return WebSearchResponse(results=results)
