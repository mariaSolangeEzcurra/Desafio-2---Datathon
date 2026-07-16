from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
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