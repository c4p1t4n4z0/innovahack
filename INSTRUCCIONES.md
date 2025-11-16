# Instrucciones de Instalación y Ejecución

## Paso 1: Configurar PostgreSQL con Docker

1. Asegúrate de tener Docker y Docker Compose instalados.

2. Navega al directorio del proyecto:
```bash
cd innovahack
```

3. Inicia PostgreSQL usando Docker Compose:
```bash
docker-compose up -d
```

Este comando:
- Descargará la imagen de PostgreSQL 15 (si no la tienes)
- Creará un contenedor llamado `proyecto_postgres`
- Creará automáticamente la base de datos `proyecto_db`
- Configurará el usuario `postgres` con contraseña `postgres123`
- Expondrá PostgreSQL en el puerto `5432`

4. Verifica que el contenedor esté corriendo:
```bash
docker ps
```

Deberías ver el contenedor `proyecto_postgres` en estado "Up".

5. (Opcional) Para ver los logs de PostgreSQL:
```bash
docker-compose logs -f postgres
```

**Nota:** Las credenciales ya están configuradas en `docker-compose.yml` y en `backend/.env`. Si necesitas cambiarlas, edita ambos archivos.

## Paso 2: Configurar Backend (Python)

1. Ve a la carpeta del proyecto y luego al backend:
```bash
cd innovahack/backend
```

2. Crea un entorno virtual:
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

3. Instala las dependencias:
```bash
pip install -r requirements.txt
```

4. Configura las variables de entorno:
   - Copia el archivo de ejemplo a `.env`:
   ```bash
   # En Windows (PowerShell)
   Copy-Item env.example .env
   
   # En Linux/Mac
   cp env.example .env
   ```
   - El archivo `.env` tiene las credenciales correctas para Docker por defecto
   - Si necesitas cambiar algo, edita `backend/.env`

5. Asegúrate de que PostgreSQL esté corriendo (Paso 1) antes de ejecutar el servidor.

6. Ejecuta el servidor:
```bash
python app.py
```

El backend estará corriendo en: `http://localhost:5000`

## Paso 3: Configurar Frontend (React)

1. Abre una nueva terminal y ve a la carpeta frontend:
```bash
cd innovahack/frontend
```

2. Instala las dependencias:
```bash
npm install
```

3. Ejecuta la aplicación:
```bash
npm start
```

El frontend se abrirá automáticamente en: `http://localhost:3000`

## ¡Listo! 🎉

Ahora puedes:
- Registrar un nuevo usuario desde la interfaz
- Iniciar sesión con tus credenciales

## Comandos Útiles de Docker

- **Detener PostgreSQL:**
```bash
docker-compose stop
```

- **Iniciar PostgreSQL nuevamente:**
```bash
docker-compose start
```

- **Detener y eliminar el contenedor (NO elimina la base de datos):**
```bash
docker-compose down
```

- **Detener y eliminar TODO (incluyendo la base de datos):**
```bash
docker-compose down -v
```

- **Ver los logs:**
```bash
docker-compose logs -f postgres
```

## Notas Importantes

- Asegúrate de que PostgreSQL (Docker) esté corriendo antes de iniciar el backend
- El backend debe estar corriendo antes de usar el frontend
- La primera vez que ejecutes el backend, se crearán las tablas automáticamente
- Los datos de PostgreSQL se guardan en un volumen de Docker, así que no se perderán al detener el contenedor

