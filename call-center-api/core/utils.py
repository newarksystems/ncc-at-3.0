from datetime import datetime, timezone, timedelta

EAT_TZ = timezone(timedelta(hours=3))  # East Africa Time (UTC+3)

def to_eat_timezone(dt: datetime | None) -> str | None:
    if dt is None:
        return None
    # Ensure the datetime is timezone-aware (UTC)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    # Convert to EAT
    eat_dt = dt.astimezone(EAT_TZ)
    return eat_dt.isoformat()