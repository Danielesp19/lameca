#!/usr/bin/env sh
set -e

# Render inyecta $PORT (normalmente 10000); por defecto 10000 en local.
PORT="${PORT:-10000}"

echo "→ Enlazando storage público…"
php artisan storage:link || true

echo "→ Migrando base de datos (Postgres)…"
php artisan migrate --force

# NOTA: el disco del backend en Render es efímero. Las imágenes subidas en vivo
# desde el panel admin se pierden al reiniciar/redeploy. Para cargar el menú de
# demo, ejecuta una vez en el Shell de Render:
#   php artisan db:seed --class=MenuSeeder --force
# (usa --class=MenuSeeder, NO el db:seed normal: ese crea un usuario con faker,
#  ausente en producción --no-dev, y falla.)

echo "→ Iniciando servidor en 0.0.0.0:${PORT}"
exec php artisan serve --host 0.0.0.0 --port "${PORT}"
