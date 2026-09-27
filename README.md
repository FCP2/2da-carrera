# Voces que Corren

Base inicial del proyecto con:

- Node.js
- Express 5
- EJS
- Tailwind CSS 4
- PostgreSQL
- Arquitectura modular

## Arranque rápido

1. Copia `.env.example` a `.env`.
2. Pega tu External Database URL en `DATABASE_URL`.
3. Instala dependencias:

```bash
npm install
```

4. En una terminal:

```bash
npm run dev
```

5. En otra terminal:

```bash
npm run css
```

6. Abre:

```text
http://localhost:3000
```

## Cambio de opciones de género

La creación de una base nueva usa `database/migrations/001_initial_schema.sql` con categoría de competencia y respuesta LGBTIQ+ opcional. Si la tabla `participantes` ya existe, ejecuta `database/migrations/003_categoria_lgbtiq.sql`; conserva las columnas antiguas para datos históricos y deja de usarlas en nuevos registros.

## Próximos módulos

- eventos
- participantes
- registros
- confirmación por token
- folios
- correo con Resend
- QR
- check-in
- kits
- dashboard
- galería con disco persistente en Render

## Almacenamiento de la galería

La galería lee las imágenes desde `GALLERY_STORAGE_PATH`. En local usa por defecto
`./storage/gallery`; en Render configura la variable con la ruta del disco persistente:

```ini
GALLERY_STORAGE_PATH=/var/data/gallery
```

La estructura esperada es:

```text
gallery/
├── salida/
├── recorrido/
├── meta/
├── convivencia/
└── institucional/
```

Las imágenes se sirven mediante `/media/gallery/<categoria>/<archivo>`. La aplicación
solo admite archivos de imagen con extensión `jpg`, `jpeg`, `png`, `webp`, `gif` o `avif`.
En producción, las cargas deberán hacerse dentro del punto de montaje persistente; no se
deben guardar fotografías nuevas en `public/img/gallery`.
