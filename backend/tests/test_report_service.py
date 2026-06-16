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


# --- get_agronomist_digest_data tests ---

def _make_farm(name="Farm A", owner_name="Grace", active_crop_count=2, avg_health=0.78, has_critical=False):
    farm = MagicMock()
    farm.farm_name = name
    farm.farm_id = uuid4()

    # owner = registered platform User
    owner = MagicMock()
    owner.full_name = owner_name
    farm.owner = owner
    farm.managed_farmer = None

    # planted crops
    crop = MagicMock()
    crop.status = "active"
    crop.user_id = uuid4()
    health_entry = MagicMock()
    health_entry.health_score = avg_health
    health_entry.created_at = datetime.now(timezone.utc)
    crop.health_history = [health_entry]

    inactive_crop = MagicMock()
    inactive_crop.status = "harvested"
    inactive_crop.user_id = uuid4()
    inactive_crop.health_history = []

    farm.planted_crops = [crop] * active_crop_count + [inactive_crop]

    return farm


def _make_db_agro(farms, has_critical_alert=False):
    db = MagicMock()

    farm_query = MagicMock()
    farm_query.options.return_value = farm_query
    farm_query.filter.return_value = farm_query
    farm_query.all.return_value = farms

    alert_query = MagicMock()
    alert_query.filter.return_value = alert_query
    alert_result = MagicMock() if has_critical_alert else None
    alert_query.first.return_value = alert_result

    from app.models.farm import Farm
    from app.models.alert import Alert

    def query_side(model):
        if model is Farm:
            return farm_query
        if model is Alert:
            return alert_query
        return MagicMock()

    db.query.side_effect = query_side
    return db


def test_get_agronomist_digest_data_returns_farm_list():
    from app.services.report_service import get_agronomist_digest_data
    farms = [_make_farm("Farm A"), _make_farm("Farm B")]
    db = _make_db_agro(farms)
    result = get_agronomist_digest_data(uuid4(), db)
    assert len(result) == 2
    assert result[0]["farm_name"] == "Farm A"


def test_get_agronomist_digest_data_farmer_name_from_owner():
    from app.services.report_service import get_agronomist_digest_data
    farm = _make_farm(owner_name="Grace Uwera")
    db = _make_db_agro([farm])
    result = get_agronomist_digest_data(uuid4(), db)
    assert result[0]["farmer_name"] == "Grace Uwera"


def test_get_agronomist_digest_data_farmer_name_fallback_to_managed_farmer():
    from app.services.report_service import get_agronomist_digest_data
    farm = _make_farm()
    farm.owner = None
    managed = MagicMock()
    managed.full_name = "Offline Farmer"
    farm.managed_farmer = managed
    db = _make_db_agro([farm])
    result = get_agronomist_digest_data(uuid4(), db)
    assert result[0]["farmer_name"] == "Offline Farmer"


def test_get_agronomist_digest_data_farmer_name_unknown_when_no_owner():
    from app.services.report_service import get_agronomist_digest_data
    farm = _make_farm()
    farm.owner = None
    farm.managed_farmer = None
    db = _make_db_agro([farm])
    result = get_agronomist_digest_data(uuid4(), db)
    assert result[0]["farmer_name"] == "Unknown"


def test_get_agronomist_digest_data_active_crop_count():
    from app.services.report_service import get_agronomist_digest_data
    farm = _make_farm(active_crop_count=3)
    db = _make_db_agro([farm])
    result = get_agronomist_digest_data(uuid4(), db)
    assert result[0]["active_crop_count"] == 3


def test_get_agronomist_digest_data_has_critical_alerts():
    from app.services.report_service import get_agronomist_digest_data
    farm = _make_farm()
    db = _make_db_agro([farm], has_critical_alert=True)
    result = get_agronomist_digest_data(uuid4(), db)
    assert result[0]["has_critical_alerts"] is True


def test_get_agronomist_digest_data_no_critical_alerts():
    from app.services.report_service import get_agronomist_digest_data
    farm = _make_farm()
    db = _make_db_agro([farm], has_critical_alert=False)
    result = get_agronomist_digest_data(uuid4(), db)
    assert result[0]["has_critical_alerts"] is False
