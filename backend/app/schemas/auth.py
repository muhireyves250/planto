from pydantic import BaseModel, ConfigDict, EmailStr, field_validator
from typing import Literal
from datetime import datetime
from uuid import UUID

class UserBase(BaseModel):
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str
    role: Literal["farmer", "agronomist", "admin"] = "farmer"

    @field_validator("role")
    @classmethod
    def validate_role(cls, v):
        if v not in ["farmer", "agronomist"]:
            # Admin cannot be created via public signup
            if v == "admin":
                return "farmer" # Default back to farmer or raise error
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    role: str

class UserProfileBase(BaseModel):
    phone: str | None = None
    country: str | None = None
    farm_size: str | None = None
    preferred_language: str | None = None

class UserProfileDB(UserProfileBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class UserDB(UserBase):
    id: UUID
    role: str
    is_active: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str | None = None
