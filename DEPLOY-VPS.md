# Despliegue en VPS Hostinger (Ubuntu 24.04) — modo solo-IP

Guía para un VPS Ubuntu 24.04 limpio, **sin dominio todavía**:
- Carta y panel admin → `http://IP_VPS`
- API + archivos (fotos/videos/PDF) → `http://IP_VPS:8080`

Reemplaza `IP_VPS` por la IP pública del VPS en todo el documento.
Cuando compres el dominio, sigue la sección **"Migrar a dominio"** al final.

## 0. En tu PC (antes de tocar el VPS)

```bash
# 1) Reemplaza IP_VPS (y la clave de BD) en:
#    menu-service/.env.production   y   frontend/.env.production
# 2) Código al día:
git push origin main
```

## 1. Paquetes base (en el VPS como root)

```bash
apt update && apt upgrade -y
apt install -y nginx mariadb-server git ufw ffmpeg \
  php8.3-fpm php8.3-cli php8.3-mysql php8.3-sqlite3 php8.3-xml php8.3-curl \
  php8.3-mbstring php8.3-zip php8.3-gd php8.3-intl composer

# Node 20 + pm2 (para el frontend Next.js)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm i -g pm2
```

## 2. Firewall

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 8080/tcp
ufw --force enable
```

## 3. Base de datos

```bash
mysql -e "CREATE DATABASE lameca CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'lameca'@'localhost' IDENTIFIED BY '38610d732c3e43f0dabfe96bb8907f23';
GRANT ALL PRIVILEGES ON lameca.* TO 'lameca'@'localhost'; FLUSH PRIVILEGES;"
```
(usa la misma `CLAVE_BD_FUERTE` que pusiste en `menu-service/.env.production`)

## 4. Código y variables de entorno

```bash
mkdir -p /var/www && cd /var/www
git clone https://github.com/Danielesp19/lameca.git
```

Los `.env` de producción NO están en git — súbelos **desde tu PC**:

```bash
scp menu-service/.env.production root@IP_VPS:/var/www/lameca/menu-service/.env
scp frontend/.env.production     root@IP_VPS:/var/www/lameca/frontend/.env.production
```

## 5. Backend Laravel

```bash
cd /var/www/lameca/menu-service
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan storage:link
php artisan config:cache && php artisan route:cache && php artisan view:cache
chown -R www-data:www-data storage bootstrap/cache

# Límites de subida de PHP (videos de hasta 15 MB):
sed -i 's/^upload_max_filesize.*/upload_max_filesize = 25M/; s/^post_max_size.*/post_max_size = 30M/' /etc/php/8.3/fpm/php.ini
systemctl restart php8.3-fpm
```

Menú de demo (opcional): 
`php artisan db:seed --class=MenuSeeder --force`
(SOLO MenuSeeder; el seed completo crea usuarios y usa dependencias de dev).

## 6. Nginx

`/etc/nginx/sites-available/api` — backend en el puerto **8080**:

```nginx
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
```

`/etc/nginx/sites-available/carta` — frontend en el puerto **80**:

```nginx
server {
    listen 80 default_server;
    server_name _;
    # Las subidas del admin pasan por este proxy en modo http:
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
```

```bash
ln -s /etc/nginx/sites-available/api   /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/carta /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

## 7. Frontend Next.js

```bash
cd /var/www/lameca/frontend
npm ci
npm run build          # lee frontend/.env.production
pm2 start npm --name lameca-front -- start
pm2 startup systemd && pm2 save
```

## 8. Cron del scheduler (expira/purga pedidos)

```bash
crontab -e
# añadir:
* * * * * cd /var/www/lameca/menu-service && php artisan schedule:run >> /dev/null 2>&1
```

## 9. Verificación final

```bash
curl -s http://IP_VPS:8080/up                      # → 200
curl -s http://IP_VPS:8080/api/menu | head -c 200  # → JSON del menú
curl -sI http://IP_VPS:8080/api/menu/pdf | head -3 # → application/pdf
curl -sI http://IP_VPS/menu | head -3              # → 200 de la carta
which ffmpeg                                       # → /usr/bin/ffmpeg
reboot                                             # el VPS pide reinicio de kernel
```

Tras el reboot: pm2 levanta el frontend solo; nginx/php-fpm/mysql arrancan solos.

**Prueba de fuego**: desde el celular (datos móviles) abre `http://IP_VPS/menu`,
entra al panel en `http://IP_VPS/admin`, crea una mesa, abre su QR
(`http://IP_VPS/t/<token>`) y haz un pedido.

## ⚠️ Limitaciones del modo solo-IP (temporales)

- **Sin HTTPS**: el token del admin viaja en claro. Usa el panel solo desde
  redes de confianza (no Wi-Fi público) hasta tener dominio + TLS.
- **No imprimas QRs todavía**: apuntarían a `http://IP_VPS/t/...` y quedarán
  obsoletos al migrar al dominio.

## Migrar a dominio (cuando lo compres)

1. DNS: registros A de `@` y `api` → IP_VPS.
2. Backend `.env`: `APP_URL=https://api.DOMINIO`, `CORS_ALLOWED_ORIGINS=https://DOMINIO`,
   `SESSION_SECURE_COOKIE=true` → `php artisan config:cache`.
3. Frontend `.env.production`: las tres URLs a `https://api.DOMINIO`
   (`BACKEND_URL` y `MENU_API_INTERNAL` pueden seguir en `http://127.0.0.1:8080`)
   y `NEXT_PUBLIC_BACKEND_URL=https://api.DOMINIO` → `npm run build && pm2 restart lameca-front`.
4. Nginx: en `carta` poner `server_name DOMINIO www.DOMINIO;` y en `api`
   añadir un server en `listen 80` con `server_name api.DOMINIO` (mismo root).
5. `apt install -y certbot python3-certbot-nginx` y
   `certbot --nginx -d DOMINIO -d www.DOMINIO -d api.DOMINIO --redirect`.
6. Cerrar el 8080 al exterior si ya no lo usas: `ufw delete allow 8080/tcp`.
7. Reimprimir los QRs de mesa con el dominio.

## Actualizaciones futuras

```bash
cd /var/www/lameca && git pull
cd menu-service && composer install --no-dev && php artisan migrate --force \
  && php artisan config:cache && php artisan route:cache && php artisan view:cache
cd ../frontend && npm ci && npm run build && pm2 restart lameca-front
```
