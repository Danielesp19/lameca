# Despliegue de demo — CoffeeClub / La Meca

Despliegue **gratuito** para mostrar funcionamiento. No es configuración definitiva.

- **Backend** (Laravel) → Render (Docker) + **Postgres gratis** de Render.
- **Frontend** (Next.js) → Vercel.
- **Media** (imágenes/videos) → disco efímero del backend (ver aviso al final).

> Tiempo aprox.: 20–30 min. Necesitas cuentas (gratis) en **Render** y **Vercel**, y el repo en GitHub.

---

## 1. Backend en Render

1. Sube el repo a GitHub (si no lo está).
2. En Render: **New → Blueprint** → conecta este repositorio. Render detecta
   [`render.yaml`](render.yaml) y propone crear:
   - `coffeeclub-db` (Postgres free)
   - `coffeeclub-api` (web service Docker)
3. Antes de **Apply**, rellena las variables marcadas `sync: false`:
   - **APP_KEY**: en tu PC, dentro de `menu-service/`, corre
     `php artisan key:generate --show` y pega el valor (`base64:....`).
   - **ADMIN_TOKEN**: genera uno fuerte → `php -r "echo bin2hex(random_bytes(32));"`.
     Anótalo, lo reusarás en Vercel.
   - **APP_URL** y **CORS_ALLOWED_ORIGINS**: aún no sabes las URLs finales →
     déjalas temporalmente vacías o con un placeholder; las completas en el paso 3.
4. **Apply**. Render construye la imagen y corre las migraciones al arrancar.
   Cuando termine, copia la URL del servicio (p.ej. `https://coffeeclub-api.onrender.com`).
5. (Opcional, recomendado) Cargar el menú de demo: en Render abre el **Shell** del
   servicio y corre `php artisan db:seed --class=MenuSeeder --force`.
   > Usa `--class=MenuSeeder`, **no** el `db:seed` normal: ese intenta crear un
   > usuario con *faker* (dependencia de desarrollo, ausente en producción) y falla.

## 2. Frontend en Vercel

1. En Vercel: **Add New → Project** → importa el repo.
2. **Root Directory**: `frontend`.
3. En **Environment Variables** (Production), añade (ver
   [`frontend/.env.production.example`](frontend/.env.production.example)):
   | Variable | Valor |
   |---|---|
   | `BACKEND_URL` | URL de Render (p.ej. `https://coffeeclub-api.onrender.com`) |
   | `MENU_API_INTERNAL` | `…onrender.com/api` |
   | `NEXT_PUBLIC_BACKEND_URL` | URL de Render |
   | `ADMIN_PASSWORD` | clave de acceso al panel admin |
   | `ADMIN_TOKEN` | **el mismo** ADMIN_TOKEN que pusiste en Render |
4. **Deploy**. Copia la URL final (p.ej. `https://coffeeclub.vercel.app`).

## 3. Conectar los dos extremos

En **Render**, edita las env vars del backend y vuelve a desplegar:
- `APP_URL` = URL del backend en Render.
- `CORS_ALLOWED_ORIGINS` = URL del frontend en Vercel (sin barra final).
  Ej.: `https://coffeeclub.vercel.app`

Listo. Abre la URL de Vercel: la carta debe cargar desde Postgres.

---

## (Opcional) Dominio propio

Solo compras **un** dominio. Lo apuntas así:
- `tudominio.com` y `www` → Vercel (frontend).
- `api.tudominio.com` → Render (backend).

Luego actualiza `BACKEND_URL`/`MENU_API_INTERNAL`/`NEXT_PUBLIC_BACKEND_URL` (Vercel)
y `APP_URL`/`CORS_ALLOWED_ORIGINS` (Render) a los dominios nuevos. Ambos dan HTTPS gratis.

---

## Límites de esta demo (importante)

- ⚠️ **Media efímera**: las imágenes/videos que subas **en vivo** desde el panel admin
  se borran cuando Render reinicia o redespliega el contenedor. Para producción real
  hay que mover la media a almacenamiento externo (Cloudflare R2 / Cloudinary).
- ⏱️ **Cold start**: el plan free de Render duerme el servicio tras ~15 min sin tráfico;
  la primera petición tras dormir tarda ~30–50 s.
- 🗓️ **Postgres free** dura ~90 días; luego hay que renovar/migrar.
