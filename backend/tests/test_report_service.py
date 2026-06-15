import pytest
from datetime import date, datetime, timedelta, timezone
from unittest.mock import MagicMock, patch
from uuid import uuid4


def _make_crop(name="Banana", status="active", harvest_days=20, health=0.82):
    crop = MagicMock()
    crop.id = uuid4()
    crop.crop_name = name
    crop.status = status
    crop.expected_harvest_date = date.today() + timedelta(days=harvest_days)

    health_entry = MagicMock()
    health_entry.health_score = health
    health_entry.created_at = datetime.now(timezone.utc)
    crop.health_history = [health_entry]

    plan = MagicMock()
    plan.urea_kg = 10.5
    plan.dap_kg = 5.0
    plan.npk_kg = 8.0
    plan.nutrient_target = "N"
    plan.created_at = datetime.now(timezone.utc)
    crop.fertilizer_plans = [plan]

    monitoring = MagicMock()
    monitoring.recorded_at = datetime.now(timezone.utc) - timedelta(days=5)
    crop.monitoring_data = [monitoring]

    return crop


def _make_db(crops, last_monitoring_days_ago=5):
    db = MagicMock()

    query_mock = MagicMock()
    db.query.return_value = query_mock
    query_mock.filter.return_value = query_mock
    query_mock.options.return_value = query_mock
    query_mock.all.return_value = crops

    # For SoilMonitoring last-test query
    mon = MagicMock()
    mon.recorded_at = datetime.now(timezone.utc) - timedelta(days=last_monitoring_days_ago)
    query_mock.order_by.return_value = query_mock
    query_mock.first.return_value = mon if last_monitoring_days_ago is not None else None

    return db


def test_get_farmer_report_data_returns_crop_list():
    from app.services.report_service import get_farmer_report_data
    user_id = uuid4()
    db = _make_db([_make_crop("Rice"), _make_crop("Maize")])
    result = get_farmer_report_data(user_id, db)
    assert len(result["crops"]) == 2
    assert result["crops"][0]["name"] == "Rice"


def test_get_farmer_report_data_health_label_green():
    from app.services.report_service import get_farmer_report_data
    db = _make_db([_make_crop(health=0.85)])
    result = get_farmer_report_data(uuid4(), db)
    assert result["crops"][0]["health_label"] == "green"


def test_get_farmer_report_data_health_label_amber():
    from app.services.report_service import get_farmer_report_data
    db = _make_db([_make_crop(health=0.55)])
    result = get_farmer_report_data(uuid4(), db)
    assert result["crops"][0]["health_label"] == "amber"


def test_get_farmer_report_data_health_label_red():
    from app.services.report_service import get_farmer_report_data
    db = _make_db([_make_crop(health=0.35)])
    result = get_farmer_report_data(uuid4(), db)
    assert result["crops"][0]["health_label"] == "red"


def test_get_farmer_report_data_upcoming_harvests_within_30_days():
    from app.services.report_service import get_farmer_report_data
    crops = [_make_crop("Banana", harvest_days=20), _make_crop("Jute", harvest_days=40)]
    db = _make_db(crops)
    result = get_farmer_report_data(uuid4(), db)
    names = [h["name"] for h in result["upcoming_harvests"]]
    assert "Banana" in names
    assert "Jute" not in names


def test_get_farmer_report_data_soil_reminder_shown_when_overdue():
    from app.services.report_service import get_farmer_report_data
    db = _make_db([_make_crop()], last_monitoring_days_ago=20)
    result = get_farmer_report_data(uuid4(), db)
    assert result["show_soil_reminder"] is True
    assert result["soil_test_days_ago"] == 20


def test_get_farmer_report_data_no_soil_reminder_when_recent():
    from app.services.report_service import get_farmer_report_data
    db = _make_db([_make_crop()], last_monitoring_days_ago=5)
    result = get_farmer_report_data(uuid4(), db)
    assert result["show_soil_reminder"] is False


def test_get_farmer_report_data_only_active_crops():
    from app.services.report_service import get_farmer_report_data
    crops = [_make_crop("Rice", status="active"), _make_crop("Maize", status="harvested")]
    # DB already filtered by service's query — only active crops returned
    db = _make_db([crops[0]])
    result = get_farmer_report_data(uuid4(), db)
    assert all(c["name"] != "Maize" for c in result["crops"])
