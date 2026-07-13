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