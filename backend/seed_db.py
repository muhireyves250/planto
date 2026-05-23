import sys
import os
from datetime import date, datetime

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, Base
from app.core.security import get_password_hash
from app.models.user import User, UserProfile
from app.models.farm import Farm, FarmMember
from app.models.planted_crop import PlantedCrop, CropHealthHistory
from app.models.soil_monitoring import SoilMonitoring
from app.models.fertilizer import FertilizerPlan

def seed_database():
    print("Seeding database...")
    db = SessionLocal()
    try:
        # 1. Create User
        farmer_email = "farmer@planto.com"
        existing_user = db.query(User).filter(User.email == farmer_email).first()
        if existing_user:
            print("User already exists, skipping user creation.")
            farmer = existing_user
        else:
            farmer = User(
                email=farmer_email,
                hashed_password=get_password_hash("password"),
                full_name="Muhire Yves",
                role="farmer"
            )
            db.add(farmer)
            db.commit()
            db.refresh(farmer)
            print(f"Created farmer user: {farmer.email}")

        # 2. Create User Profile
        existing_profile = db.query(UserProfile).filter(UserProfile.user_id == farmer.id).first()
        if not existing_profile:
            profile = UserProfile(
                user_id=farmer.id,
                phone="0788888888",
                country="Rwanda",
                farm_size="5 hectares",
                preferred_language="English"
            )
            db.add(profile)
            print("Created farmer profile.")

        # 3. Create Farm
        existing_farm = db.query(Farm).filter(Farm.owner_id == farmer.id).first()
        if existing_farm:
            farm = existing_farm
        else:
            farm = Farm(
                owner_id=farmer.id,
                farm_name="Main Farm Field",
                farm_size="5 hectares",
                soil_type="loamy",
                irrigation_type="drip"
            )
            db.add(farm)
            db.commit()
            db.refresh(farm)
            print(f"Created farm: {farm.farm_name}")

            # Add member
            member = FarmMember(
                farm_id=farm.id,
                user_id=farmer.id,
                role_in_farm="owner"
            )
            db.add(member)

        # 4. Create Planted Crop
        existing_crop = db.query(PlantedCrop).filter(PlantedCrop.user_id == farmer.id).first()
        if existing_crop:
            crop = existing_crop
        else:
            crop = PlantedCrop(
                user_id=farmer.id,
                farm_id=farm.id,
                crop_name="rice",
                planting_date=date(2026, 5, 14),
                status="active"
            )
            db.add(crop)
            db.commit()
            db.refresh(crop)
            print(f"Created planted crop: {crop.crop_name}")

        # 5. Create Soil Monitoring
        has_monitoring = db.query(SoilMonitoring).filter(SoilMonitoring.plant_id == crop.id).first()
        if not has_monitoring:
            monitoring = SoilMonitoring(
                plant_id=crop.id,
                recorded_by=farmer.id,
                nitrogen=120.0,
                phosphorus=60.0,
                potassium=40.0,
                ph=6.5,
                moisture=75.0,
                temperature=24.0,
                humidity=62.0
            )
            db.add(monitoring)
            print("Created initial soil monitoring log.")

        # 6. Create Health History
        has_health = db.query(CropHealthHistory).filter(CropHealthHistory.plant_id == crop.id).first()
        if not has_health:
            health = CropHealthHistory(
                plant_id=crop.id,
                health_score=100.0,
                risk_level="Healthy",
                stage="germination",
                notes="Initial soil configuration."
            )
            db.add(health)
            print("Created initial crop health history.")

        # 7. Create Fertilizer Plan
        has_plan = db.query(FertilizerPlan).filter(FertilizerPlan.plant_id == crop.id).first()
        if not has_plan:
            plan = FertilizerPlan(
                plant_id=crop.id,
                nitrogen_deficit=0.0,
                phosphorus_deficit=0.0,
                potassium_deficit=0.0,
                urea_kg=0.0,
                dap_kg=0.0,
                npk_kg=0.0,
                fertilizer_type="None",
                quantity_kg=0.0,
                nutrient_target="None",
                explanation="Initial soil balance is optimal. No fertilizer required.",
                generated_by="system"
            )
            db.add(plan)
            print("Created initial fertilizer plan.")

        db.commit()
        print("Database seeded successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
