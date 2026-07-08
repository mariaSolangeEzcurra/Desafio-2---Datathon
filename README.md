# 🚀 Desafío 2 - Datathon

Sistema de monitoreo territorial, cálculo de KPIs y alertas de productividad para cuadrillas en campo.

## 👥 Roles del Sistema

*   **Supervisor de Campo (Operativo):** Ve el día a día. Sigue cuadrillas, valida rutas por GPS y gestiona alertas inmediatas (productividad < 80%, desvíos > 20%, inactividad).
*   **Gestor / Coordinador (Táctico):** Compara el rendimiento entre diferentes zonas, consolida reportes de supervisores y ajusta cargas de trabajo.
*   **Gerencia / Dirección (Estratégico):** Ve la evolución histórica global de la EPS, tendencias de calidad del servicio y toma decisiones de presupuesto o recursos.

---

## 🛠️ Stack Tecnológico

*   **Frontend:** React (Dashboard), Plotly (Gráficos y Mapas GPS), Node.js (Entorno).
*   **Backend:** Python, FastAPI (API Rest y Swagger), NumPy (Cálculo estadístico de KPIs y percentil P80).
*   **Base de Datos:** PostgreSQL (Única fuente de verdad).
*   **Despliegue:** Docker (Contenedor Backend), Vercel (Frontend), Render/Railway (Backend + BD).

---

## 📂 Estructura Inicial Recomendada

Para empezar a trabajar de forma ordenada, crearemos las siguientes carpetas:

```text
├── backend/     # Código de Python, FastAPI y NumPy
├── frontend/    # Código de React y Plotly
└── README.md    # Este archivo