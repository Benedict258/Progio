import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.research_project import ResearchProject
from app.schemas.research import (
    PaperSearchRequest,
    PaperResponse,
    ResearchProjectCreate,
    ResearchProjectResponse,
    CitationCreate,
    CitationResponse,
    CitationFormatRequest,
    CitationFormatResponse,
)
from app.services.research import (
    search_papers,
    get_all_papers,
    format_citation,
    create_citation_id,
)

router = APIRouter(prefix="/api/research", tags=["research"])


@router.post("/discover", response_model=list[PaperResponse])
async def discover_literature(request: PaperSearchRequest):
    """Search for relevant academic papers using vector similarity."""
    results = search_papers(request.query, limit=10)
    return results


@router.get("/papers", response_model=list[PaperResponse])
async def list_papers():
    """List all papers in the database."""
    return get_all_papers()


@router.post("/projects", response_model=ResearchProjectResponse)
async def create_research_project(
    project: ResearchProjectCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new research project."""
    new_project = ResearchProject(
        id=str(uuid.uuid4()),
        user_id=project.user_id,
        title=project.title,
        notes={"content": ""},
        citations=[],
        linked_application_id=project.linked_application_id,
    )
    db.add(new_project)
    await db.commit()
    await db.refresh(new_project)
    return new_project


@router.get("/projects", response_model=list[ResearchProjectResponse])
async def list_research_projects(
    user_id: str = Query(..., description="User ID"),
    db: AsyncSession = Depends(get_db),
):
    """List all research projects for a user."""
    query = (
        select(ResearchProject)
        .where(ResearchProject.user_id == user_id)
        .order_by(ResearchProject.created_at.desc())
    )
    result = await db.execute(query)
    projects = result.scalars().all()
    return projects


@router.get("/projects/{project_id}", response_model=ResearchProjectResponse)
async def get_research_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific research project with notes and citations."""
    result = await db.execute(
        select(ResearchProject).where(ResearchProject.id == project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Research project not found")
    return project


@router.put("/projects/{project_id}/notes", response_model=ResearchProjectResponse)
async def update_project_notes(
    project_id: str,
    notes: dict,
    db: AsyncSession = Depends(get_db),
):
    """Update the notes for a research project."""
    result = await db.execute(
        select(ResearchProject).where(ResearchProject.id == project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Research project not found")

    project.notes = notes
    project.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(project)
    return project


@router.post(
    "/projects/{project_id}/citations", response_model=ResearchProjectResponse
)
async def add_citation_to_project(
    project_id: str,
    citation: CitationCreate,
    db: AsyncSession = Depends(get_db),
):
    """Add a citation to a research project."""
    result = await db.execute(
        select(ResearchProject).where(ResearchProject.id == project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Research project not found")

    citation_dict = citation.model_dump()
    citation_dict["id"] = create_citation_id()

    if project.citations is None:
        project.citations = []
    project.citations.append(citation_dict)
    project.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(project)
    return project


@router.delete(
    "/projects/{project_id}/citations/{citation_id}",
    response_model=ResearchProjectResponse,
)
async def remove_citation_from_project(
    project_id: str,
    citation_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Remove a citation from a research project."""
    result = await db.execute(
        select(ResearchProject).where(ResearchProject.id == project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Research project not found")

    if not project.citations:
        raise HTTPException(status_code=404, detail="No citations found")

    original_len = len(project.citations)
    project.citations = [c for c in project.citations if c.get("id") != citation_id]

    if len(project.citations) == original_len:
        raise HTTPException(status_code=404, detail="Citation not found")

    project.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(project)
    return project


@router.post("/citations/format", response_model=CitationFormatResponse)
async def format_citation_endpoint(request: CitationFormatRequest):
    """Format a citation in the specified style."""
    try:
        formatted = format_citation(request.citation.model_dump(), request.style)
        return CitationFormatResponse(formatted=formatted, style=request.style)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
