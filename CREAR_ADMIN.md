# Crear Usuario Administrador

## Opción 1: Usando el Script (Recomendado)

1. **Asegúrate de que el backend esté corriendo:**
```bash
cd innovahack/backend
python app.py
```

2. **En otra terminal, ejecuta el script:**
```bash
cd innovahack/backend
python scripts/create_admin.py
```

3. **Sigue las instrucciones en pantalla:**
   - Ingresa el nombre de usuario
   - Ingresa el email
   - Ingresa la contraseña (mínimo 6 caracteres)

**Ejemplo:**
```
Ingresa el nombre de usuario: admin
Ingresa el email: admin@proyecto.com
Ingresa la contraseña (mínimo 6 caracteres): admin123
```

## Opción 2: Crear directamente desde Python

1. **Abre Python en el directorio backend:**
```bash
cd innovahack/backend
python
```

2. **Ejecuta el siguiente código:**
```python
from app import app
from models.user import User
from config.database import db

with app.app_context():
    # Crear usuario administrador
    admin = User(
        username='admin',
        username='admin',
        email='admin@proyecto.com',
        password='admin123',
        role='admin'
    )
    db.session.add(admin)
    db.session.commit()
    print('Usuario administrador creado exitosamente')
```

## Notas Importantes

- ⚠️ **El endpoint público `/api/auth/register` NO permite crear administradores** por seguridad
- ✅ **Los usuarios creados desde el frontend siempre serán `role='user'`**
- ✅ **Solo los administradores pueden crear otros administradores** (cuando se implemente JWT)
- 🔐 **Cambia la contraseña por defecto** después de crear el administrador

## Verificar que el Admin se Creó Correctamente

Puedes verificar en la base de datos:
```sql
SELECT id, username, email, role FROM users WHERE role = 'admin';
```

O ejecutando:
```bash
cd innovahack/backend
python
```

```python
from app import app
from models.user import User
from config.database import db

with app.app_context():
    admins = User.query.filter_by(role='admin').all()
    for admin in admins:
        print(f"Admin: {admin.username} - {admin.email} - {admin.role}")
```

