from pydantic import BaseModel


class LoginRequest(BaseModel):
    usuario: str
    password: str


class LoginResponse(BaseModel):
    success: bool
    usuario: str | None = None
    rol: str | None = None
    message: str | None = None