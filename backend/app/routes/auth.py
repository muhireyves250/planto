from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import random
import requests
from uuid import UUID
import smtplib
from email.mime.text import MIMEText
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, get_password_hash
from app.schemas import auth as auth_schemas
from app.repositories import user_repo
from app.models.user import User
from app.core.config import settings
from app.core.rbac import role_required, get_current_user

router = APIRouter(tags=["Authentication"])

# In-memory OTP store for the prototype
otp_store = {}

def send_otp_email(to_email: str, otp: str):
    print(f"--- OTP FOR {to_email}: {otp} ---")
    
    if not settings.SMTP_EMAIL or not settings.SMTP_PASSWORD:
        print("SMTP credentials not configured. OTP printed to console only.")
        return True
        
    try:
        msg = MIMEText(f"Your Planto verification code is: {otp}\n\nThis code will expire in 10 minutes.")
        msg['Subject'] = 'Planto - Verification Code'
        msg['From'] = settings.SMTP_EMAIL
        msg['To'] = to_email

        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(settings.SMTP_EMAIL, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

@router.post("/register", response_model=auth_schemas.UserDB)
async def register(user: auth_schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = user_repo.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return user_repo.create_user(db=db, user=user)

@router.post("/login")
async def login(user: auth_schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = user_repo.get_user_by_email(db, email=user.email)
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Role restriction: Email registered for one role cannot be used for other role
    if db_user.role != user.role:
        raise HTTPException(
            status_code=401, 
            detail=f"This account is registered as a {db_user.role}. Please select the correct role."
        )
    
    otp = str(random.randint(100000, 999999))
    otp_store[user.email] = otp
    send_otp_email(user.email, otp)
    
    return {"success": True, "requires_otp": True, "message": "OTP sent to your email"}

@router.post("/verify-otp")
async def verify_otp(data: dict, db: Session = Depends(get_db)):
    email = data.get("email")
    otp = data.get("otp")
    
    # Backdoor OTP for local developer testing
    if otp != '000000' and (email not in otp_store or otp_store[email] != otp):
        raise HTTPException(status_code=401, detail="Invalid or expired verification code")
        
    db_user = user_repo.get_user_by_email(db, email=email)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if email in otp_store:
        del otp_store[email]
    
    access_token = create_access_token(data={
        "sub": db_user.email,
        "role": db_user.role,
        "user_id": str(db_user.id)
    })
    return {
        "success": True, 
        "access_token": access_token,
        "user": {
            "id": str(db_user.id),
            "email": db_user.email,
            "full_name": db_user.full_name,
            "role": db_user.role
        }
    }

@router.post("/auth/google")
async def google_auth(data: dict, db: Session = Depends(get_db)):
    token = data.get("token")
    requested_role = data.get("role", "farmer")
    
    if not token:
        raise HTTPException(status_code=400, detail="Google token missing")
    
    # Restriction: Admin and Agronomist cannot login with Google (requested role check)
    if requested_role in ["admin", "agronomist"]:
        raise HTTPException(
            status_code=403, 
            detail=f"Registration or login as {requested_role} is restricted via Google. Please use email and password."
        )
    
    try:
        response = requests.get(f"https://www.googleapis.com/oauth2/v3/userinfo?access_token={token}")
        if not response.ok:
            raise HTTPException(status_code=401, detail="Invalid Google token")
        
        user_info = response.json()
        email = user_info.get("email")
        full_name = user_info.get("name")
        
        db_user = user_repo.get_user_by_email(db, email=email)
        if not db_user:
            user_create = auth_schemas.UserCreate(
                email=email,
                full_name=full_name,
                password=str(random.getrandbits(128)),
                role=requested_role
            )
            db_user = user_repo.create_user(db=db, user=user_create)
        
        # Restriction: Admin and Agronomist cannot login with Google (DB role check)
        if db_user.role in ["admin", "agronomist"]:
            raise HTTPException(
                status_code=403, 
                detail=f"Accounts with {db_user.role} role are restricted from Google login. Please use email and password."
            )
            
        access_token = create_access_token(data={
            "sub": db_user.email,
            "role": db_user.role,
            "user_id": str(db_user.id)
        })
        return {
            "success": True,
            "access_token": access_token,
            "user": {
                "id": str(db_user.id),
                "email": db_user.email,
                "full_name": db_user.full_name,
                "role": db_user.role
            }
        }
    except HTTPException:
        # Re-raise HTTP exceptions so they aren't caught by the generic Exception block
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Google Auth Error: {str(e)}")

@router.post("/forgot-password")
async def forgot_password(data: dict, db: Session = Depends(get_db)):
    email = data.get("email")
    db_user = user_repo.get_user_by_email(db, email=email)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    otp = str(random.randint(100000, 999999))
    otp_store[email] = otp
    send_otp_email(email, otp)
    return {"success": True, "message": "Reset code sent to your email"}

@router.post("/reset-password")
async def reset_password(data: dict, db: Session = Depends(get_db)):
    email = data.get("email")
    otp = data.get("otp")
    new_password = data.get("new_password")
    
    if email not in otp_store or otp_store[email] != otp:
        raise HTTPException(status_code=401, detail="Invalid or expired reset code")
        
    db_user = user_repo.get_user_by_email(db, email=email)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user_repo.update_user_password(db, db_user.id, get_password_hash(new_password))
    del otp_store[email]
    
    return {"success": True, "message": "Password reset successfully"}

@router.get("/settings/{user_id}")
async def get_settings(user_id: UUID, db: Session = Depends(get_db)):
    db_user = user_repo.get_user_by_id(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    profile = user_repo.get_user_profile(db, user_id=user_id)
    
    return {
        "full_name": db_user.full_name,
        "email": db_user.email,
        "phone": profile.phone if profile else None,
        "country": profile.country if profile else None,
        "farm_size": profile.farm_size if profile else None,
        "preferred_language": profile.preferred_language if profile else None
    }

@router.put("/settings/{user_id}")
async def update_settings(user_id: UUID, settings: auth_schemas.UserProfileBase, db: Session = Depends(get_db)):
    profile = user_repo.update_user_profile(db, user_id=user_id, profile_data=settings)
    return {"success": True, "message": "Settings updated successfully"}

@router.get("/users", response_model=list[auth_schemas.UserDB])
async def get_users(db: Session = Depends(get_db), current_user: User = Depends(role_required(["admin"]))):
    """Admin only: list all users"""
    return db.query(User).all()
