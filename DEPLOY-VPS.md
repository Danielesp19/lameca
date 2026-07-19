# Despliegue en VPS Hostinger (Ubuntu 24.04) — modo solo-IP

Guía para un VPS Ubuntu 24.04 limpio, **sin dominio todavía** (IP: `2.25.87.113`):
- Carta y panel admin → `http://2.25.87.113`
- API + archivos (fotos/videos/PDF) → `http://2.25.87.113:8080`

**Todos los bloques son de copiar y pegar completos** en la terminal del VPS
(como root), en orden. Cuando compres el dominio: sección "Migrar a dominio".
Las claves/secretos NO van en esta guía: viven en los `.env` del servidor.

## 1. Paquetes base ✅ (hecho)

```bash
apt update && apt upgrade -y
apt install -y nginx mariadb-server git ufw ffmpeg \
  php8.3-fpm php8.3-cli php8.3-mysql php8.3-sqlite3 php8.3-xml php8.3-curl \
  php8.3-mbstring php8.3-zip php8.3-gd php8.3-intl composer
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm i -g pm2
```

## 2. Firewall ✅ (hecho)

```bash
ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 8080/tcp && ufw --force enable
```

## 3. Base de datos ✅ (hecho)

Base `lameca`, usuario `lameca`, con la clave que está en
`menu-service/.env` del servidor (línea `DB_PASSWORD`):

```bash
mysql -e "CREATE DATABASE lameca CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'lameca'@'localhost' IDENTIFIED BY 'LA_CLAVE_DEL_ENV';
GRANT ALL PRIVILEGES ON lameca.* TO 'lameca'@'localhost'; FLUSH PRIVILEGES;"
```

## 4. Código y .env ✅ (hecho)

Clone en `/var/www/lameca` + los dos `.env` creados con los bloques `cat` del
chat (backend: `menu-service/.env` · frontend: `frontend/.env.production`).

## 5. Backend Laravel ✅ (hecho)

> Si el `composer install` falla con "requires php >=8.4": corre
> `cd /var/www/lameca && git pull` (el lock ya está fijado a PHP 8.3 en el
> repo) y repite el bloque.

```bash
cd /var/www/lameca/menu-service
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan storage:link
php artisan config:cache && php artisan route:cache && php artisan view:cache
chown -R www-data:www-data storage bootstrap/cache
sed -i 's/^upload_max_filesize.*/upload_max_filesize = 25M/; s/^post_max_size.*/post_max_size = 30M/' /etc/php/8.3/fpm/php.ini
systemctl restart php8.3-fpm
```

(El menú de demo NO se siembra: la carta arranca vacía; los productos reales
entrarán con el seeder nuevo o desde el panel admin.)

## 6. Nginx — el "portero" que enruta el tráfico

Nginx recibe las visitas y las reparte: lo que llegue al puerto **80** se lo
pasa al frontend Next.js (que corre interno en el puerto 3000), y lo que
llegue al **8080** lo ejecuta el backend Laravel vía PHP-FPM. Cada uno es un
"sitio" definido en un archivo de configuración — los creamos con `cat`,
igual que hicimos con los `.env`.

**6a. Sitio del backend** (pega el bloque entero, crea el archivo):

```bash
cat > /etc/nginx/sites-available/api <<'EOF'
server {
    listen 8080;
    server_name _;
    root /var/www/lameca/menu-service/public;
    index index.php;
    client_max_body_size 30m;

    location / { try_files $uri $uri/ /index.php?$query_string; }
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
    }
    location ~ /\.(?!well-known) { deny all; }
}
EOF
```

**6b. Sitio del frontend** (pega el bloque entero):

```bash
cat > /etc/nginx/sites-available/carta <<'EOF'
server {
    listen 80 default_server;
    server_name _;
    client_max_body_size 30m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF
```

**6c. Activar los sitios y recargar** (un sitio solo funciona si tiene enlace
en `sites-enabled`; se elimina la página de bienvenida por defecto de nginx):

```bash
ln -sf /etc/nginx/sites-available/api   /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/carta /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

`nginx -t` debe imprimir `syntax is ok` y `test is successful` — si dice otra
cosa, NO recargó: lee el mensaje de error.

**Prueba rápida** (el backend ya responde; el frontend aún no — falta el paso 7):

```bash
curl -s http://localhost:8080/up >/dev/null && echo "backend OK"
```

## 7. Frontend Next.js — compilar y dejarlo vivo

`npm ci` instala dependencias exactas, `npm run build` compila leyendo
`frontend/.env.production`, y **pm2** es el supervisor: mantiene el proceso
corriendo, lo reinicia si se cae y lo arranca solo cuando el VPS enciende.

```bash
cd /var/www/lameca/frontend
npm ci
npm run build
pm2 start npm --name lameca-front -- start
pm2 startup systemd
pm2 save
```

Qué esperar:
- El `build` tarda 1-3 min y termina listando las rutas (`/menu`, `/admin`, …).
- **`pm2 startup systemd` imprime un comando largo pidiéndote ejecutarlo — cópialo y ejecútalo tal cual** (es lo que registra el autoarranque).
- Verifica con `pm2 status`: debe decir `lameca-front │ online`.

## 8. Cron del scheduler — limpieza automática de pedidos

Laravel necesita un "despertador" cada minuto para sus tareas programadas
(expirar pedidos abandonados y borrar los del día a medianoche). Este bloque
lo agrega al crontab sin abrir editores y te muestra cómo quedó:

```bash
(crontab -l 2>/dev/null; echo "* * * * * cd /var/www/lameca/menu-service && php artisan schedule:run >> /dev/null 2>&1") | crontab -
crontab -l
```

## 9. Verificación final

```bash
curl -s http://2.25.87.113:8080/up >/dev/null && echo "✓ backend"
curl -s http://2.25.87.113:8080/api/menu; echo " ← [] es normal (menú vacío)"
curl -sI http://2.25.87.113:8080/api/menu/pdf | head -1
curl -sI http://2.25.87.113/menu | head -1
which ffmpeg
```

Todo OK → `reboot` (hay un kernel pendiente de reinicio). Tras 1-2 min todo
levanta solo. Prueba desde el celular: `http://2.25.87.113/menu` y `/admin`.

## ⚠️ Limitaciones del modo solo-IP (temporales)

- **Sin HTTPS**: usa el panel admin solo desde redes de confianza.
- **No imprimas QRs de mesa**: apuntarían a la IP y quedarán obsoletos al
  migrar al dominio.

## Migrar a dominio (cuando lo compres)

1. DNS: registros A de `@` y `api` → 2.25.87.113.
2. Backend `.env`: `APP_URL=https://api.DOMINIO`, `CORS_ALLOWED_ORIGINS=https://DOMINIO`,
   `SESSION_SECURE_COOKIE=true` → `php artisan config:cache`.
3. Frontend `.env.production`: `NEXT_PUBLIC_BACKEND_URL=https://api.DOMINIO`
   (las URLs internas `127.0.0.1:8080` quedan igual) → `npm run build && pm2 restart lameca-front`.
4. Nginx: en `carta` cambiar `server_name _;` por `server_name DOMINIO www.DOMINIO;`
   y en `api` añadir otro bloque `server` en puerto 80 con `server_name api.DOMINIO`.
5. `apt install -y certbot python3-certbot-nginx` →
   `certbot --nginx -d DOMINIO -d www.DOMINIO -d api.DOMINIO --redirect`.
6. Cerrar el 8080: `ufw delete allow 8080/tcp`.
7. Imprimir los QRs de mesa (ahora sí, con dominio).

## Actualizaciones futuras (cada vez que subamos código)

```bash
cd /var/www/lameca && git pull
cd menu-service && composer install --no-dev && php artisan migrate --force \
  && php artisan config:cache && php artisan route:cache && php artisan view:cache
cd ../frontend && npm ci && npm run build && pm2 restart lameca-front
```
