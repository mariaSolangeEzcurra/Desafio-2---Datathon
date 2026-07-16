from pydantic import BaseModel, EmailStr

class UsuarioUpdate(BaseModel):
    nombre: str
    correo: EmailStr
    rol: str
    estado: str

class UsuarioCreate(BaseModel):
    nombre: str
    correo: EmailStr
    password: str
    rol: str
    estado: str = "Activo"

class UsuarioResponse(BaseModel):
    id_usuario: str
    nombre: str
    correo: EmailStr
    rol: str
    estado: str
    class Config:
        from_attributes = True