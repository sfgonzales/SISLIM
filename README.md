# SISLIM - Plataforma de Limpieza del Hogar

**Integrantes del Proyecto:**
1. Gonzales Mamani Sergio Fernando
2. Mamani Morales Cristhian Daniel

---

Este proyecto es una implementación Full-Stack para la aplicación de limpieza del hogar **SISLIM**, desarrollado utilizando la metodología **Spec-Driven Development (SDD)**. 

Actualmente el sistema integra los módulos de **Gestión de Usuarios** y **Gestión de Productos/Servicios**.

## 🛠️ Tecnologías Utilizadas

### Backend
*   **Lenguaje:** Python 3
*   **Framework:** FastAPI (Rápido, moderno y con documentación automática)
*   **Base de Datos:** Supabase
*   **Cliente de Datos:** HTTP REST con `httpx`
*   **Seguridad:** JSON Web Tokens (JWT) para autenticación y `bcrypt` para encriptación de contraseñas.
*   **Testing (SDD):** `pytest` y `httpx` para pruebas automatizadas del comportamiento del sistema.

### Frontend
*   **Librería Principal:** React.js
*   **Empaquetador:** Vite
*   **Estilos:** Vanilla CSS puro (Diseño *Glassmorphism* enriquecido con animaciones y gradientes)
*   **Peticiones HTTP:** Axios

---

## ✨ Características y Funcionalidades

### Sprint 1: Gestión de Usuarios
1.  **Autenticación Segura (Login):** Acceso protegido mediante JWT. El usuario debe iniciar sesión para poder ver el panel principal.
2.  **Operaciones CRUD de Usuarios:**
    *   Crear, Leer, Actualizar y Eliminar usuarios. *Si el usuario se borra a sí mismo, el sistema cerrará su sesión automáticamente.*

### Sprint 2: Gestión de Productos/Servicios (SDD)
1.  **Gestión para Ofertantes:** Registro y edición de los servicios/productos que ofrecen (título, descripción, precio y categoría).
2.  **Validación por el Administrador:** Control de calidad de la plataforma. Los administradores pueden cambiar el estado de un servicio de "Pendiente" a "Aprobado" o "Rechazado".
3.  **Reglas de Negocio:** La edición de campos críticos en un servicio revierte automáticamente su estado a "Pendiente".
4.  **UI/UX Avanzada:**
    *   Selectores dinámicos y estados de tablas interactivos.
    *   Modal elegante para lectura de descripciones de servicios largas sin deformar la tabla.

### Diseño Premium 
*   Interfaz responsiva con diseño *Glassmorphism* (sombras, transparencias, gradientes).
*   Uso estricto de la paleta de colores corporativa de la marca SISLIM.

---

## 🎨 Paleta de Colores SISLIM

El diseño frontend se basó en los siguientes tokens de color:
*   🔵 **Dark Blue (`#023047`):** Usado para texto principal, barras de navegación y elementos de alto contraste.
*   🩵 **Blue Green (`#219ebc`):** Usado para botones secundarios y acentos suaves.
*   ☁️ **Light Blue (`#8ecae6`):** Usado para gradientes de fondo y bordes.
*   🟡 **Yellow (`#ffb703`):** Color primario para botones de acción principales y alertas.
*   🟠 **Orange (`#fb8500`):** Color de peligro, utilizado para advertencias y botones de eliminación.

---

## 🚀 Cómo Ejecutar el Proyecto Localmente

Para correr esta aplicación en tu computadora, necesitas tener instalados **Python** y **Node.js**.

### 1. Iniciar el Backend (API)
Abre una terminal en la carpeta raíz del proyecto y ejecuta:

```powershell
# 1. Ingresar a la carpeta del backend
cd backend

# 2. Crear y activar el entorno virtual
python -m venv venv
.\venv\Scripts\activate

# 3. Instalar las dependencias necesarias
pip install -r requirements.txt

# 4. Iniciar el servidor FastAPI
uvicorn main:app --reload
```
La API estará corriendo en: `http://localhost:8000` (Puedes ver la documentación interactiva en `/docs`).

### 2. Iniciar el Frontend (Interfaz de Usuario)
Abre **otra terminal nueva** en la carpeta raíz del proyecto y ejecuta:

```powershell
# 1. Ingresar a la carpeta del frontend
cd frontend

# 2. Instalar los paquetes de Node
npm install

# 3. Iniciar el servidor de desarrollo de Vite
npm run dev
```
La aplicación web estará disponible en: `http://localhost:5173`

---

## 📝 Notas para el Desarrollador
*   **Usuario por defecto:** Crea el primer usuario en Supabase usando la documentación interactiva de FastAPI (`http://localhost:8000/docs` -> `POST /users/`) antes de iniciar sesión en el frontend.
*   **Tokens:** El token JWT se almacena temporalmente en el `localStorage` del navegador web bajo la llave `token`.
---

## Ejecutar Frontend y Backend Juntos

Para probarlo como se ejecutara en Render, primero compila el frontend:

```powershell
cd frontend
npm run build
```

Luego inicia solo el backend desde otra terminal:

```powershell
cd backend
.\venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

Con esta modalidad, abre la app desde `http://localhost:8000`. FastAPI sirve el frontend compilado desde `frontend/dist` y tambien mantiene activos los endpoints de la API.

Si sigues desarrollando la interfaz, puedes continuar usando dos terminales como antes: Vite en `http://localhost:5173` y FastAPI en `http://localhost:8000`.

## Despliegue en Render como Web Service

En Render usa **New > Web Service** y configura el servicio desde la raiz del repositorio:

```text
Runtime: Python
Root Directory: dejar vacio
Build Command: cd frontend && npm install && npm run build && cd ../backend && pip install -r requirements.txt
Start Command: cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
```

Variables de entorno necesarias en Render:

```env
SUPABASE_URL=tu-url-de-supabase
SUPABASE_KEY=tu-clave-de-supabase
SECRET_KEY=una-clave-secreta-para-jwt
```

No configures `VITE_API_URL` en Render si frontend y backend viven en el mismo Web Service; el frontend usara rutas relativas como `/token` y `/users/`.
