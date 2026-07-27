from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.applications import router as applications_router
from app.api.opportunities import router as opportunities_router
from app.api.profile import router as profile_router
from app.api.projects import router as projects_router

app = FastAPI(title="Progio API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(opportunities_router)
app.include_router(profile_router)
app.include_router(applications_router)
app.include_router(projects_router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
