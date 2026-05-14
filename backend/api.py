from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
# Import the existing prediction logic
from predict import predict_crop

# Import DB components
import models
import schemas
import crud
from database import engine, get_db

# Create DB tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Crop Recommendation API", description="Pro-Remediation Version", version="1.0.0")

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/predict", response_model=schemas.PredictionResponse)
async def predict(data: schemas.SoilFeatures, db: Session = Depends(get_db)):
    try:
        crop, confidence, advice, status = predict_crop(
            n=data.n,
            p=data.p,
            k=data.k,
            temperature=data.temperature,
            humidity=data.humidity,
            ph=data.ph,
            rainfall=data.rainfall
        )
        
        # Save to PostgreSQL
        prediction_record = schemas.PredictionCreate(
            **data.model_dump(),
            predicted_crop=crop,
            confidence=confidence
        )
        crud.create_prediction(db=db, prediction=prediction_record)

        return {
            "success": True,
            "crop": crop,
            "confidence": confidence,
            "advice": advice,
            "status": status
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/predictions", response_model=List[schemas.PredictionDB])
async def read_predictions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    predictions = crud.get_predictions(db, skip=skip, limit=limit)
    return predictions

@app.post("/register", response_model=schemas.UserDB)
async def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

import random
import smtplib
from email.mime.text import MIMEText
import os

# Store OTPs in memory for the prototype (email -> otp)
otp_store = {}

def send_otp_email(to_email: str, otp: str):
    print(f"--- OTP FOR {to_email}: {otp} ---") # Always print for debugging
    
    sender_email = os.getenv("SMTP_EMAIL", "")
    sender_password = os.getenv("SMTP_PASSWORD", "")
    
    if not sender_email or not sender_password:
        print("SMTP credentials not configured. OTP printed to console only.")
        return True
        
    try:
        msg = MIMEText(f"Your Planto login verification code is: {otp}\n\nThis code will expire in 10 minutes.")
        msg['Subject'] = 'Planto - Your Login Verification Code'
        msg['From'] = sender_email
        msg['To'] = to_email

        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

@app.post("/login")
async def login_user(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if not db_user or not crud.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Generate OTP
    otp = str(random.randint(100000, 999999))
    otp_store[user.email] = otp
    
    # Send OTP
    send_otp_email(user.email, otp)
    
    return {
        "success": True, 
        "requires_otp": True,
        "message": "OTP sent to your email"
    }

class VerifyOTP(schemas.BaseModel):
    email: str
    otp: str

@app.post("/verify-otp")
async def verify_otp(data: VerifyOTP, db: Session = Depends(get_db)):
    if data.email not in otp_store or otp_store[data.email] != data.otp:
        raise HTTPException(status_code=401, detail="Invalid or expired verification code")
        
    db_user = crud.get_user_by_email(db, email=data.email)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Clear OTP after successful use
    del otp_store[data.email]
    
    return {
        "success": True, 
        "user": {
            "id": db_user.id,
            "email": db_user.email,
            "full_name": db_user.full_name
        }
    }

class ForgotPassword(schemas.BaseModel):
    email: str

@app.post("/forgot-password")
async def forgot_password(data: ForgotPassword, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=data.email)
    if not db_user:
        # We still return success to prevent email enumeration attacks
        return {"success": True, "message": "If the email exists, an OTP has been sent."}
        
    otp = str(random.randint(100000, 999999))
    otp_store[data.email + "_reset"] = otp
    
    # Send OTP
    send_otp_email(data.email, otp)
    
    return {"success": True, "message": "If the email exists, an OTP has been sent."}

class ResetPassword(schemas.BaseModel):
    email: str
    otp: str
    new_password: str

@app.post("/reset-password")
async def reset_password(data: ResetPassword, db: Session = Depends(get_db)):
    store_key = data.email + "_reset"
    if store_key not in otp_store or otp_store[store_key] != data.otp:
        raise HTTPException(status_code=401, detail="Invalid or expired reset code")
        
    db_user = crud.get_user_by_email(db, email=data.email)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Hash new password and update user
    hashed_password = crud.get_password_hash(data.new_password)
    db_user.hashed_password = hashed_password
    db.commit()
    
    # Clear OTP
    del otp_store[store_key]
    
    return {"success": True, "message": "Password reset successfully. You can now log in."}

class GoogleAuth(schemas.BaseModel):
    token: str

import requests

@app.post("/auth/google")
async def google_auth(auth_data: GoogleAuth, db: Session = Depends(get_db)):
    try:
        # Fetch user info from Google using the access token
        response = requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {auth_data.token}"}
        )
        if not response.ok:
            raise HTTPException(status_code=400, detail="Invalid Google token")
            
        user_info = response.json()
        email = user_info.get("email")
        full_name = user_info.get("name")
        
        if not email:
            raise HTTPException(status_code=400, detail="Could not get email from Google")
            
        # Check if user exists
        db_user = crud.get_user_by_email(db, email=email)
        
        if not db_user:
            # Create a new user with a random password since they use Google
            import secrets
            import string
            alphabet = string.ascii_letters + string.digits
            random_password = ''.join(secrets.choice(alphabet) for i in range(16))
            
            user_create = schemas.UserCreate(
                email=email,
                password=random_password,
                full_name=full_name
            )
            db_user = crud.create_user(db=db, user=user_create)
            
        return {
            "success": True,
            "user": {
                "id": db_user.id,
                "email": db_user.email,
                "full_name": db_user.full_name
            }
        }
    except Exception as e:
        print("Google Auth Error:", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/settings/{user_id}", response_model=schemas.UserDB)
async def get_user_settings(user_id: int, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_id(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@app.put("/settings/{user_id}", response_model=schemas.UserDB)
async def update_user_settings(user_id: int, settings: schemas.UserSettingsUpdate, db: Session = Depends(get_db)):
    db_user = crud.update_user_settings(db, user_id=user_id, settings=settings)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
