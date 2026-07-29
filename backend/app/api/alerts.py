from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.alert_preference import AlertPreference
from app.models.notification import Notification
from app.models.opportunity import Opportunity

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class AlertPreferenceCreate(BaseModel):
    user_id: str
    track: str  # grant | scholarship
    field_of_study: str | None = None
    region: str | None = None
    deadline_urgency: str | None = None  # any | 1_week | 1_month | 3_months
    notify_channels: list[str] | None = None


class AlertPreferenceResponse(BaseModel):
    id: str
    user_id: str
    track: str
    filters: dict | None = None
    notify_channels: list[str] | None = None
    created_at: str | None = None


class NotificationResponse(BaseModel):
    id: str
    user_id: str
    opportunity_id: str
    title: str
    message: str
    match_score: float | None = None
    is_read: bool = False
    created_at: str | None = None
    opportunity_title: str | None = None
    opportunity_provider: str | None = None


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("", response_model=list[NotificationResponse])
async def get_user_alerts(
    user_id: str = Query(..., description="User ID"),
    unread_only: bool = Query(False, description="Only unread notifications"),
    db: AsyncSession = Depends(get_db),
):
    """Get notifications (alerts) for a user, newest first."""
    query = select(Notification).where(Notification.user_id == user_id)
    if unread_only:
        query = query.where(Notification.is_read == False)
    query = query.order_by(Notification.created_at.desc()).limit(50)
    result = await db.execute(query)
    notifs = list(result.scalars().all())

    # Fetch opportunity titles for display
    if notifs:
        opp_ids = list({n.opportunity_id for n in notifs})
        opp_result = await db.execute(select(Opportunity).where(Opportunity.id.in_(opp_ids)))
        opps = {o.id: o for o in opp_result.scalars().all()}
    else:
        opps = {}

    return [
        NotificationResponse(
            id=n.id,
            user_id=n.user_id,
            opportunity_id=n.opportunity_id,
            title=n.title,
            message=n.message,
            match_score=n.match_score,
            is_read=n.is_read,
            created_at=n.created_at.isoformat() if n.created_at else None,
            opportunity_title=opps.get(n.opportunity_id, None) and opps[n.opportunity_id].title,
            opportunity_provider=opps.get(n.opportunity_id, None) and opps[n.opportunity_id].provider,
        )
        for n in notifs
    ]


@router.get("/unread-count")
async def get_unread_count(
    user_id: str = Query(..., description="User ID"),
    db: AsyncSession = Depends(get_db),
):
    """Return the number of unread notifications for badge display."""
    from sqlalchemy import func as sqlfunc
    result = await db.execute(
        select(sqlfunc.count(Notification.id)).where(
            Notification.user_id == user_id,
            Notification.is_read == False,
        )
    )
    count = result.scalar() or 0
    return {"count": count}


@router.get("/preferences", response_model=list[AlertPreferenceResponse])
async def get_alert_preferences(
    user_id: str = Query(..., description="User ID"),
    db: AsyncSession = Depends(get_db),
):
    """Get all alert preferences for a user."""
    result = await db.execute(
        select(AlertPreference).where(AlertPreference.user_id == user_id)
    )
    prefs = list(result.scalars().all())
    return [
        AlertPreferenceResponse(
            id=p.id,
            user_id=p.user_id,
            track=p.track,
            filters=p.filters,
            notify_channels=p.notify_channels,
            created_at=p.created_at.isoformat() if p.created_at else None,
        )
        for p in prefs
    ]


@router.post("/preferences", response_model=AlertPreferenceResponse)
async def create_alert_preference(
    body: AlertPreferenceCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new alert preference."""
    filters = {}
    if body.field_of_study:
        filters["field_of_study"] = body.field_of_study
    if body.region:
        filters["region"] = body.region
    if body.deadline_urgency:
        filters["deadline_urgency"] = body.deadline_urgency

    pref = AlertPreference(
        user_id=body.user_id,
        track=body.track,
        filters=filters or None,
        notify_channels=body.notify_channels,
    )
    db.add(pref)
    await db.commit()
    await db.refresh(pref)

    return AlertPreferenceResponse(
        id=pref.id,
        user_id=pref.user_id,
        track=pref.track,
        filters=pref.filters,
        notify_channels=pref.notify_channels,
        created_at=pref.created_at.isoformat() if pref.created_at else None,
    )


@router.delete("/preferences/{alert_id}")
async def delete_alert_preference(
    alert_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Delete an alert preference."""
    pref = await db.get(AlertPreference, alert_id)
    if not pref:
        raise HTTPException(status_code=404, detail="Alert preference not found")
    await db.delete(pref)
    await db.commit()
    return {"deleted": True}


@router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Mark a single notification as read."""
    notif = await db.get(Notification, notification_id)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    await db.commit()
    return {"updated": True}


@router.post("/notifications/read-all")
async def mark_all_notifications_read(
    user_id: str = Query(..., description="User ID"),
    db: AsyncSession = Depends(get_db),
):
    """Mark all notifications for a user as read."""
    result = await db.execute(
        select(Notification).where(
            Notification.user_id == user_id,
            Notification.is_read == False,
        )
    )
    notifs = list(result.scalars().all())
    for n in notifs:
        n.is_read = True
    await db.commit()
    return {"marked_read": len(notifs)}
