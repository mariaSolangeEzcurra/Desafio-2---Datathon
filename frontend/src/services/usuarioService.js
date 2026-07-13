const API_URL = "http://localhost:8000/api/usuarios";

export async function obtenerUsuarios() {
    const token = localStorage.getItem("token");
    const response = await fetch(API_URL, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail);
    }
    return data;
}

export async function crearUsuario(usuario) {
    const token = localStorage.getItem("token");
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(usuario),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail);
    }
    return data;
}

export async function actualizarUsuario(id, datos) {
    const response = await fetch(
        `http://localhost:8000/api/usuarios/${id}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(datos),
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || "Error al actualizar usuario");
    }

    return data;
}

export async function eliminarUsuario(id) {
    const response = await fetch(
        `http://localhost:8000/api/usuarios/${id}`,{
            method: "DELETE",
        }
    );
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Error al eliminar usuario");
    }
    return data;
}