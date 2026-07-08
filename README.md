# NVO — Bitácora de Ruta

App web para que los mensajeros de NVO/Cruz Verde marquen entrada y salida con foto + GPS, con panel administrativo.

## Arquitectura

```
nvo-app/
├── server/index.js      ← Backend Express + SQLite (reemplaza window.storage)
├── src/
│   ├── main.jsx          ← Entry point React
│   ├── App.jsx           ← App completa (migrada del artifact original)
│   └── storage.js        ← Adaptador que conecta al backend via fetch
├── data/                 ← Se crea automáticamente, contiene nvo.db
├── vite.config.js        ← Vite con proxy /api → localhost:3001
├── index.html
└── package.json
```

## Requisitos

- **Node.js 18+** (para `better-sqlite3`)
- npm o pnpm

## Instalación

```bash
cd nvo-app
npm install
```

> Si `better-sqlite3` falla al compilar, asegúrate de tener las build tools:
> - **macOS**: `xcode-select --install`
> - **Ubuntu/Debian**: `sudo apt install build-essential python3`
> - **Windows**: `npm install --global windows-build-tools`

## Desarrollo local

```bash
npm run dev
```

Esto arranca **dos procesos simultáneos**:
1. **Backend** en `http://0.0.0.0:3001` (Express + SQLite)
2. **Frontend** en `http://0.0.0.0:5173` (Vite dev server)

Vite proxea automáticamente `/api/*` al backend.

## Probar desde el celular (misma red WiFi)

1. Averigua la IP local de tu computadora:
   - **macOS/Linux**: `ifconfig | grep "inet "` o `ip addr`
   - **Windows**: `ipconfig`
   - Busca algo como `192.168.1.XX`

2. Desde el navegador del celular, abre:
   ```
   http://192.168.1.XX:5173
   ```

3. **Nota sobre HTTPS**: La cámara (`getUserMedia`) y la geolocalización requieren HTTPS en producción. En desarrollo local, los navegadores suelen permitirlo por HTTP desde IPs de red local. Si tu celular bloquea la cámara:
   - Chrome Android: ir a `chrome://flags/#unsafely-treat-insecure-origin-as-secure`, agregar `http://192.168.1.XX:5173` y reiniciar Chrome.
   - Safari iOS: generalmente funciona en red local sin HTTPS.

## Base de datos

SQLite se almacena en `data/nvo.db`. Es un solo archivo que puedes copiar, respaldar o borrar para empezar de cero.

Las tablas replican el esquema de `window.storage`:
- `kv_shared` — datos compartidos (registros, puntos, mensajeros, turnos, asignaciones)
- `kv_local` — datos por dispositivo (perfil_conductor, ciudad_dispositivo)

> **Nota**: En esta primera migración, `kv_local` es compartido entre todos los que usen el mismo backend. Para separar datos por dispositivo real, se necesitaría agregar un identificador de dispositivo (cookie/token). Para la demo, esto funciona bien.

## Producción

```bash
npm run build
npm run preview   # Sirve el build en http://0.0.0.0:4173
```

Para un deploy real, considera:
1. Servir el frontend (`dist/`) con Nginx o Caddy (con HTTPS)
2. Correr el backend como servicio (pm2, systemd, Docker)
3. Migrar fotos base64 a almacenamiento de archivos (S3, Cloudinary)
4. Implementar autenticación real para el panel admin
