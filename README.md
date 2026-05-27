# Chat con React

Chat básico en tiempo real construido con **React 19 + Vite** en el cliente y **Express 5 + Socket.io 4 + Mongoose** en el servidor. Los mensajes se persisten en MongoDB y se rehidratan al abrir la app.

![](react_chat.png)

## Stack

| Capa     | Tecnología                                            |
| -------- | ----------------------------------------------------- |
| Cliente  | React 19, Vite 8, socket.io-client 4                  |
| Servidor | Node.js, Express 5, Socket.io 4, Mongoose 9 (ESM)     |
| Base     | MongoDB 6+                                            |
| UI       | Bootstrap 5 (CDN), Font Awesome 6 (CDN)               |

## Estructura

```
chat_react_tutorial/
├── client/                       # SPA con Vite + React
│   ├── index.html
│   ├── vite.config.js
│   ├── public/img/
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       └── style.css
├── server/                       # API Express + Socket.io + Mongoose
│   ├── server.js
│   ├── .env.example
│   ├── src/
│   │   ├── db.js                 # conexión a MongoDB
│   │   └── models/Message.js     # modelo Mongoose
│   └── package.json
└── package.json                  # Scripts orquestados con concurrently
```

## Requisitos

- Node.js 22 o superior
- MongoDB local en `mongodb://127.0.0.1:27017` o una URI accesible (Atlas, Docker, etc.)

## Instalación

```bash
git clone https://github.com/fazt/chat_react_tutorial
cd chat_react_tutorial
npm run install:all
```

`install:all` instala las dependencias en la raíz, en `server/` y en `client/`.

## Configuración

Copia el archivo de ejemplo y ajusta tus variables:

```bash
cp server/.env.example server/.env
```

Variables disponibles en `server/.env`:

| Variable          | Valor por defecto                                      |
| ----------------- | ------------------------------------------------------ |
| `PORT`            | `3000`                                                 |
| `MONGODB_URI`     | `mongodb://127.0.0.1:27017/chat_react_tutorial`        |
| `CLIENT_ORIGINS`  | `http://localhost:5173,http://127.0.0.1:5173`          |
| `JWT_SECRET`      | Secreto para firmar JWT. Cámbialo en desarrollo local. |
| `JWT_EXPIRES_IN`  | `1d`                                                   |

En `client/.env` (opcional):

```
VITE_SERVER_URL=http://localhost:3000
```

## Desarrollo

```bash
npm run dev
```

Esto levanta:

- **Servidor** (Socket.io + Express + Mongoose): http://localhost:3000
- **Cliente** (Vite, HMR): http://localhost:5173

Abre dos pestañas en `http://localhost:5173`, define un nombre de usuario en cada una, y envía mensajes para verlos llegar en tiempo real a ambos clientes. Al recargar, el historial se recupera desde MongoDB.

Al entrar, el cliente solicita `POST /auth/login` y guarda un JWT en `localStorage`. Ese token se envía como `Authorization: Bearer <token>` para el historial y en el handshake de Socket.io para poder publicar mensajes.

## Producción

```bash
npm run build         # genera client/dist
npm run start         # arranca server/server.js
```

## API HTTP

| Método | Ruta         | Descripción                              |
| ------ | ------------ | ---------------------------------------- |
| GET    | `/health`    | Healthcheck                              |
| POST   | `/auth/login`| Emite JWT para `{ username }`            |
| GET    | `/messages`  | Últimos 100 mensajes. Requiere JWT       |

## Eventos Socket.io

| Evento          | Dirección       | Payload                                                |
| --------------- | --------------- | ------------------------------------------------------ |
| `chat:message`  | client → server | `{ texto }`. Requiere JWT en `auth.token`              |
| `chat:message`  | server → client | `{ _id, usuario, texto, createdAt }` (broadcast)       |
| `chat:error`    | server → client | `{ message }` cuando falla el guardado                 |

## Autor

- Web: https://faztweb.com
- Twitter / X: https://twitter.com/fazttech
