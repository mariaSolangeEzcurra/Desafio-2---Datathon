const API_URL = `${import.meta.env.VITE_API_URL}/auth`;

// ============================================================
// LOGIN CON GOOGLE
// POST /auth/login
// ============================================================
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

    // Guardar autenticación
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("usuario", JSON.stringify(data.usuario));

    return data.usuario;
}


// ============================================================
// LOGIN CON CORREO Y CONTRASEÑA
// POST /auth/login-password
// ============================================================
export async function loginConPassword(correo, password) {
    const response = await fetch(`${API_URL}/login-password`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            correo: correo,
            password: password,
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        let mensaje = "No fue posible iniciar sesión.";

        if (typeof data.detail === "string") {
            mensaje = data.detail;
        } else if (Array.isArray(data.detail)) {
            mensaje = data.detail
                .map((error) => error.msg)
                .join(", ");
        }

        throw new Error(mensaje);
    }

    // Guardar autenticación
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("usuario", JSON.stringify(data.usuario));

    return data.usuario;
}


// ============================================================
// OBTENER USUARIO ACTUAL
// ============================================================
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


// ============================================================
// OBTENER TOKEN
// ============================================================
export function getToken() {
    return localStorage.getItem("token");
}


// ============================================================
// CERRAR SESIÓN
// ============================================================
export function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
}


// ============================================================
// VERIFICAR AUTENTICACIÓN
// ============================================================
export function estaAutenticado() {
    return !!localStorage.getItem("token");
}


// ============================================================
// PETICIONES PROTEGIDAS
// ============================================================
export async function fetchProtegido(url, options = {}) {
    const token = getToken();

    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
        ...(token
            ? {
                  Authorization: `Bearer ${token}`,
              }
            : {}),
    };

    const response = await fetch(url, {
        ...options,
        headers,
    });

    // Token inválido o expirado
    if (response.status === 401) {
        logout();
        window.location.href = "/login";
    }

    return response;
}
