from datetime import datetime

def format_timestamp(dt: datetime) -> str:
    """Format datetime object to a human-readable string."""
    return dt.strftime("%Y-%m-%d %H:%M:%S")

def calculate_percentage(part: float, total: float) -> float:
    """Calculate percentage safely."""
    if total <= 0:
        return 0.0
    return round((part / total) * 100, 2)

def sanitize_crop_name(name: str) -> str:
    """Clean and standardize crop names."""
    return name.strip().lower()
