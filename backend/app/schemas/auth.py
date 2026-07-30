from typing import Optional
from pydantic import BaseModel, EmailStr

class LoginRequest(BaseModel):
    token_google: Optional[str] = None

class LoginPasswordRequest(BaseModel):
    correo: EmailStr
    password: str

class UsuarioResponse(BaseModel):
    nombre: str
    correo: EmailStr
    rol: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    usuario: UsuarioResponse