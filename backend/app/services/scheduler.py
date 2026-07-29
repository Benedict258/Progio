import asyncio
import logging
from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler(timezone="UTC")


async def _scheduled_ingestion_job():
    """Wrapper that runs ingestion inside the event loop."""
    from app.services.ingestion import run_ingestion

    logger.info("Scheduled ingestion job started")
    result = await run_ingestion()
    logger.info("Scheduled ingestion job finished: %s", result)


def start_scheduler():
    """Start the scheduler with a 24-hour ingestion job. Non-blocking."""
    if scheduler.running:
        logger.info("Scheduler already running")
        return

    scheduler.add_job(
        _scheduled_ingestion_job,
        trigger=IntervalTrigger(hours=24),
        id="daily_ingestion",
        name="Daily grant/scholarship ingestion",
        replace_existing=True,
        next_run_time=None,  # don't run immediately on startup
    )
    scheduler.start()
    logger.info("Scheduler started — daily ingestion job registered")


def stop_scheduler():
    """Gracefully shut down the scheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")
