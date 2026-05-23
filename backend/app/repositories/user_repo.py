from sqlalchemy.orm import Session
from uuid import UUID
from app.models.user import User, UserProfile
from app.schemas.auth import UserCreate, UserProfileBase
from app.core.security import get_password_hash

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def get_user_by_id(db: Session, user_id: UUID):
    return db.query(User).filter(User.id == user_id).first()

def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    # Ensure admin cannot be created via signup
    final_role = user.role if user.role in ["farmer", "agronomist"] else "farmer"
    
    db_user = User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password,
        role=final_role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create empty profile
    db_profile = UserProfile(user_id=db_user.id)
    db.add(db_profile)
    db.commit()
    
    return db_user

def get_user_profile(db: Session, user_id: UUID):
    return db.query(UserProfile).filter(UserProfile.user_id == user_id).first()

def update_user_profile(db: Session, user_id: UUID, profile_data: UserProfileBase):
    db_profile = get_user_profile(db, user_id)
    if not db_profile:
        # Create if somehow missing
        db_profile = UserProfile(user_id=user_id)
        db.add(db_profile)
    
    update_data = profile_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_profile, key, value)
        
    db.commit()
    db.refresh(db_profile)
    return db_profile

def update_user_password(db: Session, user_id: UUID, new_password_hash: str):
    db_user = get_user_by_id(db, user_id)
    if db_user:
        db_user.hashed_password = new_password_hash
        db.commit()
        db.refresh(db_user)
    return db_user
