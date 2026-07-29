import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.alerts import router as alerts_router
from app.api.applications import router as applications_router
from app.api.brainstorm import router as brainstorm_router
from app.api.opportunities import router as opportunities_router
from app.api.private_opportunities import parse_router as parse_external_router
from app.api.private_opportunities import router as private_opportunities_router
from app.api.profile import router as profile_router
from app.api.projects import router as projects_router
from app.api.readiness import router as readiness_router
from app.api.refine import router as refine_router
from app.api.research import router as research_router
from app.api.template_parser import router as template_parser_router
from app.api.web_search import router as web_search_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.services.scheduler import start_scheduler, stop_scheduler

    start_scheduler()
    logger.info("Scheduler started on app boot")
    yield
    stop_scheduler()
    logger.info("Scheduler stopped on app shutdown")


app = FastAPI(title="Progio API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(opportunities_router)
app.include_router(private_opportunities_router)
app.include_router(parse_external_router)
app.include_router(profile_router)
app.include_router(applications_router)
app.include_router(alerts_router)
app.include_router(brainstorm_router)
app.include_router(projects_router)
app.include_router(readiness_router)
app.include_router(research_router)
app.include_router(refine_router)
app.include_router(web_search_router)
app.include_router(template_parser_router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}


@app.post("/api/ingestion/run")
async def trigger_ingestion():
    """Manually trigger an ingestion run (for testing/debugging)."""
    from app.services.ingestion import run_ingestion
    result = await run_ingestion()
    return result
