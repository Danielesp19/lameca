# Coffee ☕ — Monorepo

Monorepo del proyecto Coffee Club. Contiene el backend (API) y el frontend (web).

## Estructura

```
coffe/
├── backend/    # API REST en Laravel 11 (PHP 8.4) + Sanctum
└── frontend/   # App web en Next.js (TypeScript + Tailwind)
```

## Backend (Laravel)

API REST para usuarios, productores, productos, carritos, suscripciones, reseñas y recetas.

```bash
cd backend
composer install
cp .env.example .env        # luego configurar APP_KEY con: php artisan key:generate
php artisan migrate
php artisan serve            # http://127.0.0.1:8000  (rutas bajo /api)
```

Requisitos: PHP **8.4+**, Composer. Base de datos por defecto: SQLite (`backend/database/database.sqlite`).

## Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev                 # http://localhost:3000
```

Requisitos: Node.js 18+.

## Desarrollo

Cada paquete tiene su propio toolchain y se ejecuta de forma independiente. Levanta el backend y el frontend en terminales separadas.
