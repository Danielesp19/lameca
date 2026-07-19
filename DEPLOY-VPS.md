# Despliegue en VPS Hostinger (Ubuntu 24.04)

Guía para `srv1838059` (o cualquier VPS Ubuntu 24.04 limpio). Reemplaza en todo
el documento: `DOMINIO` → dominio de la carta, `api.DOMINIO` → subdominio del
backend, `IP_VPS` → IP pública del VPS.

## 0. En tu PC (antes de tocar el VPS)

```bash
# 1) Sube el commit pendiente:
git push origin main

# 2) Edita los placeholders (dominios y clave de BD) en:
#    menu-service/.env.production   y   frontend/.env.production
```

## 1. DNS (hPanel → Dominios → DNS)

Crea estos registros ya (propagan mientras instalas):

| Tipo | Nombre | Valor |
|---|---|---|
| A | @ | IP_VPS |
| A | api | IP_VPS |

## 2. Paquetes base (en el VPS como root)

```bash
apt update && apt upgrade -y
apt install -y nginx mariadb-server git ufw certbot python3-certbot-nginx ffmpeg \
  php8.3-fpm php8.3-cli php8.3-mysql php8.3-sqlite3 php8.3-xml php8.3-curl \
  php8.3-mbstring php8.3-zip php8.3-gd php8.3-intl composer

# Node 20 + pm2 (para el frontend Next.js)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm i -g pm2
```

## 3. Firewall

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
```

## 4. Base de datos

```bash
mysql -e "CREATE DATABASE lameca CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'lameca'@'localhost' IDENTIFIED BY 'CLAVE_BD_FUERTE';
GRANT ALL PRIVILEGES ON lameca.* TO 'lameca'@'localhost'; FLUSH PRIVILEGES;"
```
(usa la misma `CLAVE_BD_FUERTE` que pusiste en `menu-service/.env.production`)

## 5. Código y variables de entorno

```bash
mkdir -p /var/www && cd /var/www
git clone https://github.com/Danielesp19/lameca.git
```

Los `.env` de producción NO están en git — súbelos **desde tu PC**:

```bash
scp menu-service/.env.production root@IP_VPS:/var/www/lameca/menu-service/.env
scp frontend/.env.production     root@IP_VPS:/var/www/lameca/frontend/.env.production
```

## 6. Backend Laravel

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

Menú de demo (opcional): `php artisan db:seed --class=MenuSeeder --force`
(SOLO MenuSeeder; el seed completo crea usuarios y usa dependencias de dev).

## 7. Nginx

`/etc/nginx/sites-available/api` :

```nginx
server {
    listen 80;
    server_name api.DOMINIO;
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

`/etc/nginx/sites-available/carta` :

```nginx
server {
    listen 80;
    server_name DOMINIO www.DOMINIO;

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
ln -s /etc/nginx/sites-available/api  /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/carta /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

## 8. Frontend Next.js

```bash
cd /var/www/lameca/frontend
npm ci
npm run build          # lee frontend/.env.production
pm2 start npm --name lameca-front -- start
pm2 startup systemd && pm2 save
```

## 9. HTTPS (después de que el DNS propague)

```bash
certbot --nginx -d DOMINIO -d www.DOMINIO -d api.DOMINIO --redirect -m tu@correo.com --agree-tos
```

## 10. Cron del scheduler (expira/purga pedidos)

```bash
crontab -e
# añadir:
* * * * * cd /var/www/lameca/menu-service && php artisan schedule:run >> /dev/null 2>&1
```

## 11. Verificación final

```bash
curl -s https://api.DOMINIO/up                      # → ok (200)
curl -s https://api.DOMINIO/api/menu | head -c 200  # → JSON del menú
curl -sI https://api.DOMINIO/api/menu/pdf | head -3 # → application/pdf
curl -sI https://DOMINIO/menu | head -3             # → 200 de la carta
which ffmpeg                                        # → /usr/bin/ffmpeg (compresión de videos activa)
reboot                                              # el VPS pide reinicio de kernel
```

Tras el reboot: `pm2` levanta el frontend solo; nginx/php-fpm/mysql son
servicios de systemd y arrancan solos.

## Actualizaciones futuras

```bash
cd /var/www/lameca && git pull
cd menu-service && composer install --no-dev && php artisan migrate --force \
  && php artisan config:cache && php artisan route:cache && php artisan view:cache
cd ../frontend && npm ci && npm run build && pm2 restart lameca-front
```
