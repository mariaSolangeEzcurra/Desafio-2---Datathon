const API_URL = "http://localhost:8000/auth";


export async function login(correo, password) {
    const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            correo,
            password,
        }),

    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.detail || "No fue posible iniciar sesión."
        );
    }

    // Guardamos la sesión
    localStorage.setItem(
        "token",
        data.access_token
    );

    localStorage.setItem(
        "usuario",
        JSON.stringify(data.usuario)
    );

    return data.usuario;
}


/**
 * Obtener usuario almacenado
 */
export function getUsuario() {

    const usuario = localStorage.getItem("usuario");

    if (!usuario || usuario === "undefined") {
        return null;
    }

    try {
        return JSON.parse(usuario);
    } catch (error) {
        console.error("Usuario inválido en localStorage");
        return null;
    }

}

/**
 * Obtener token JWT
 */
export function getToken() {

    return localStorage.getItem("token");

}


/**
 * Cerrar sesión
 */
export function logout() {

    localStorage.removeItem("token");

    localStorage.removeItem("usuario");

}


/**
 * Saber si existe sesión
 */
export function estaAutenticado() {

    return !!localStorage.getItem("token");

}