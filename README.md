# Proyecto Login - Python Backend + React Frontend

Proyecto de autenticación con arquitectura MVC en Python (Flask) y frontend en React, utilizando PostgreSQL como base de datos.

## 🚀 Inicio Rápido

### Requisitos Previos

- Python 3.8 o superior
- Node.js 16 o superior y npm
- PostgreSQL instalado y corriendo

## Estructura del Proyecto

```
innovahack/
├── backend/
│   ├── app.py                 # Aplicación principal Flask
│   ├── requirements.txt       # Dependencias Python
│   ├── config/
│   │   ├── __init__.py
│   │   └── database.py        # Configuración de base de datos
│   ├── models/
│   │   ├── __init__.py
│   │   └── user.py            # Modelo de Usuario
│   ├── controllers/
│   │   ├── __init__.py
│   │   └── auth_controller.py # Controlador de autenticación
│   └── routes/
│       ├── __init__.py
│       └── auth_routes.py     # Rutas de autenticación
├── frontend/
│   ├── package.json           # Dependencias React
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── index.js
│       ├── App.js
│       ├── components/
│       │   ├── Login.js       # Componente de Login
│       │   └── Login.css
│       └── services/
│           └── api.js         # Servicio de API
└── README.md

```

## Instalación y Configuración

### Backend (Python)

1. **Entrar al directorio del proyecto:**
```bash
cd innovahack/backend
```

2. **Crear entorno virtual:**
```bash
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
```

3. **Instalar dependencias:**
```bash
pip install -r requirements.txt
```

4. **Configurar PostgreSQL con Docker:**
   ```bash
   cd innovahack
   docker-compose up -d
   ```
   Esto creará automáticamente la base de datos `proyecto_db` con usuario `postgres` y contraseña `postgres123`.
   
   Las credenciales ya están configuradas en `backend/.env`.

5. **Ejecutar el servidor:**
```bash
python app.py
```

El backend estará disponible en `http://localhost:5000`

### Frontend (React)

1. **Entrar al directorio del frontend:**
```bash
cd innovahack/frontend
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Ejecutar la aplicación:**
```bash
npm start
```

El frontend estará disponible en `http://localhost:3000`

## Funcionalidades

- ✅ Registro de usuarios
- ✅ Login de usuarios
- ✅ Validación de formularios
- ✅ Hash de contraseñas con bcrypt
- ✅ CORS configurado para comunicación frontend-backend
- ✅ Arquitectura MVC

## Notas

- La aplicación usa Flask para el backend siguiendo el patrón MVC
- Las contraseñas se encriptan con bcrypt antes de guardarse
- El frontend está conectado al backend mediante axios
- En producción, se debe implementar JWT para autenticación de sesiones

## Próximos pasos sugeridos

- Implementar JWT para autenticación de sesiones
- Agregar middleware de autenticación
- Crear dashboard post-login
- Implementar logout
- Agregar validaciones más robustas
- Implementar recuperación de contraseña

