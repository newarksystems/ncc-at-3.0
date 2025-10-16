from pydantic import BaseModel, EmailStr
from schemas.user import UserOut

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    """Response model for the login endpoint."""
    access_token: str
    refresh_token: str
    token_type: str
    user: UserOut