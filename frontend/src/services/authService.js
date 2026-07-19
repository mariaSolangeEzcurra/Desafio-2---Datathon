const API_URL = "http://localhost:8000/auth";

export async function loginConGoogle(tokenGoogle) {
    const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            token_google: tokenGoogle, 
        }),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(
            data.detail || "No fue posible iniciar sesión con Google."
        );
    }
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("usuario", JSON.stringify(data.usuario));
    return data.usuario;
}

export function getUsuario() {
    const usuario = localStorage.getItem("usuario");
    if (!usuario || usuario === "undefined") return null;
    try {
        return JSON.parse(usuario);
    } catch (error) {
        console.error("Usuario inválido en localStorage");
        return null;
    }
}

export function getToken() {
    return localStorage.getItem("token");
}

export function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
}

export function estaAutenticado() {
    return !!localStorage.getItem("token");
}

// Función helper para peticiones protegidas
export async function fetchProtegido(url, options = {}) {
    const token = getToken();
    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
        logout();
        window.location.href = "/login";
    }
    return response;
}