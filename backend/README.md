# Backend Supabase Setup

Este backend usa Supabase como base de datos.

## Requisitos

- Supabase project creado
- Tablas `users` y `services` en la base de datos Supabase
- Variables de entorno definidas en `backend/.env`

## Variables de entorno

Copia `backend/.env.example` a `backend/.env` y completa las claves:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_KEY=your-supabase-service-role-or-anon-key
SECRET_KEY=your-own-jwt-secret
```

## Estructura de tablas sugerida

Puedes crear las tablas directamente en Supabase usando el script SQL en `backend/supabase-schema.sql`.

### users

- `id` - integer, primary key, generated identity
- `email` - text, unique
- `full_name` - text
- `hashed_password` - text
- `role` - text, default `user`
- `is_active` - boolean, default `true`

### services

- `id` - integer, primary key, generated identity
- `title` - text
- `description` - text
- `price` - numeric
- `category` - text
- `status` - text, default `Pendiente`
- `provider_id` - integer, foreign key referencing `users.id`

## Instalación

Desde el directorio `backend`:

```bash
pip install -r requirements.txt
```

## Ejecutar

```bash
uvicorn main:app --reload
```

## Endpoints

- `POST /token`
- `POST /users/`
- `GET /users/`
- `GET /users/me/`
- `GET /users/{user_id}`
- `PUT /users/{user_id}`
- `DELETE /users/{user_id}`
- `POST /services/`
- `GET /services/`
- `GET /services/{service_id}`
- `PUT /services/{service_id}`
- `DELETE /services/{service_id}`
- `PATCH /services/{service_id}/status`
- `GET /marketplace/services/`
- `POST /service-requests/`
- `GET /service-requests/mine/`
- `GET /service-requests/incoming/`
- `PATCH /service-requests/{request_id}/status`

## Notas

- Los datos locales anteriores ya no se usan.
- El backend se conecta directamente a Supabase mediante HTTP REST con `httpx`.
