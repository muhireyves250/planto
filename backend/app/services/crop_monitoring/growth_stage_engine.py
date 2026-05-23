from datetime import datetime, date

def determine_growth_stage(planting_date):
    """
    Rule-based growth stage detection based on days since planting.
    """
    if isinstance(planting_date, datetime):
        planting_datetime = planting_date.replace(tzinfo=None)
    elif isinstance(planting_date, date):
        planting_datetime = datetime.combine(planting_date, datetime.min.time())
    else:
        planting_datetime = datetime.now()

    days = (datetime.now() - planting_datetime).days
    
    if days <= 14:
        return "germination"
    elif days <= 45:
        return "vegetative"
    else:
        return "flowering"
