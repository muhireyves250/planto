import sys
import os
sys.path.append(os.getcwd())

from database import SessionLocal
import crud
import schemas

def test_registration():
    db = SessionLocal()
    try:
        user_data = schemas.UserCreate(
            email="test@example.com",
            full_name="Test User",
            password="password123"
        )
        print("Attempting to create user...")
        user = crud.create_user(db, user_data)
        print(f"User created: {user.id}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_registration()
