usuarios = {
    "supervisor": {
        "password": "1234",
        "rol": "Supervisor"
    },
    "coordinador": {
        "password": "1234",
        "rol": "Coordinador"
    },
    "gerencia": {
        "password": "1234",
        "rol": "Gerencia"
    }
}


def autenticar_usuario(usuario: str, password: str):

    if usuario not in usuarios:
        return {
            "success": False,
            "message": "Usuario no encontrado"
        }

    if usuarios[usuario]["password"] != password:
        return {
            "success": False,
            "message": "Contraseña incorrecta"
        }

    return {
        "success": True,
        "usuario": usuario,
        "rol": usuarios[usuario]["rol"]
    }
