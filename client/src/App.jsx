import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

const formatTime = (value) => {
  if (!value) return "";
  try {
    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

const avatarFor = (name) =>
  `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(name || "anon")}`;

const App = () => {
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState(
    () => localStorage.getItem("chat:username") || ""
  );
  const [token, setToken] = useState(() => localStorage.getItem("chat:token") || "");
  const [draftUsername, setDraftUsername] = useState("");
  const [text, setText] = useState("");
  const [connected, setConnected] = useState(false);
  const [authError, setAuthError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const socketRef = useRef(null);
  const messagesRef = useRef(null);
  const messageInputRef = useRef(null);
  const usernameInputRef = useRef(null);

  useEffect(() => {
    if (!token) {
      setMessages([]);
      setConnected(false);
      return undefined;
    }

    const controller = new AbortController();

    fetch(`${SERVER_URL}/messages`, {
      signal: controller.signal,
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          clearSession();
          return [];
        }
        return res.ok ? res.json() : [];
      })
      .then((history) => setMessages(history))
      .catch((err) => {
        if (err.name !== "AbortError") console.error("history load failed", err);
      });

    const socket = io(SERVER_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", (err) => {
      setConnected(false);
      setAuthError(err.message || "No se pudo conectar al chat.");
    });
    socket.on("chat:message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      controller.abort();
      socket.disconnect();
    };
  }, [token]);

  useEffect(() => {
    if (!username) usernameInputRef.current?.focus();
    else messageInputRef.current?.focus();
  }, [username]);

  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const submitMessage = (event) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !username || !token) return;
    socketRef.current?.emit("chat:message", { texto: trimmed });
    setText("");
  };

  const pickUsername = async (event) => {
    event?.preventDefault();
    const trimmed = draftUsername.trim();
    if (!trimmed) return;

    setLoggingIn(true);
    setAuthError("");

    try {
      const res = await fetch(`${SERVER_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmed }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "No se pudo iniciar sesión.");
      }

      setUsername(data.user.username);
      setToken(data.token);
      localStorage.setItem("chat:username", data.user.username);
      localStorage.setItem("chat:token", data.token);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoggingIn(false);
    }
  };

  const clearSession = () => {
    socketRef.current?.disconnect();
    setUsername("");
    setToken("");
    setConnected(false);
    setMessages([]);
    localStorage.removeItem("chat:username");
    localStorage.removeItem("chat:token");
    setDraftUsername("");
  };

  const hasMessages = messages.length > 0;

  const headerStatus = useMemo(
    () => ({
      label: connected ? "En línea" : "Desconectado",
      className: connected ? "status" : "status offline",
    }),
    [connected]
  );

  return (
    <div className="app-shell">
      <div className="chat-card" style={{ position: "relative" }}>
        <header className="chat-header">
          <div className="brand">
            <div className="brand-mark">
              <i className="fa-solid fa-comments" aria-hidden="true"></i>
            </div>
            <div className="brand-text">
              <span className="brand-title">Chat en tiempo real</span>
              <span className="brand-sub">React 19 · Socket.io · Mongoose</span>
            </div>
          </div>
          <span className={headerStatus.className} title={headerStatus.label}>
            <span className="dot" />
            {headerStatus.label}
          </span>
        </header>

        <div className="messages" ref={messagesRef}>
          {!hasMessages && (
            <div className="empty">
              <div className="ring">
                <i className="fa-regular fa-comment-dots" aria-hidden="true"></i>
              </div>
              <div>Aún no hay mensajes.</div>
              <small>Sé el primero en escribir algo.</small>
            </div>
          )}

          {messages.map((m, i) => {
            const mine = m.usuario === username;
            return (
              <div key={m._id ?? i} className={`msg-row ${mine ? "me" : "her"}`}>
                <div className="avatar">
                  <img src={avatarFor(m.usuario)} alt="" />
                </div>
                <div>
                  <div className="msg-meta">
                    <span className="name">{mine ? "Tú" : m.usuario}</span>
                    <span>{formatTime(m.createdAt)}</span>
                  </div>
                  <div className="bubble">{m.texto}</div>
                </div>
              </div>
            );
          })}
        </div>

        <form className="composer" onSubmit={submitMessage}>
          {username && (
            <div className="username-row">
              <span className="pill">
                <i className="fa-solid fa-user" aria-hidden="true"></i>
                Estás como <strong>{username}</strong>
                <button type="button" className="change" onClick={clearSession}>
                  salir
                </button>
              </span>
            </div>
          )}
          <div className="composer-row">
            <input
              ref={messageInputRef}
              className="input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={!username}
              placeholder={username ? "Escribe un mensaje…" : "Elige un usuario primero"}
              type="text"
              autoComplete="off"
            />
            <button
              type="submit"
              className="btn btn-primary btn-icon"
              disabled={!username || !text.trim()}
              aria-label="Enviar mensaje"
            >
              <i className="fa-solid fa-paper-plane" aria-hidden="true"></i>
            </button>
          </div>
        </form>

        {!username && (
          <div className="gate">
            <form className="gate-card" onSubmit={pickUsername}>
              <div className="brand-mark" style={{ margin: "0 auto 12px" }}>
                <i className="fa-solid fa-user" aria-hidden="true"></i>
              </div>
              <h2>¿Cómo te llamas?</h2>
              <p>Elige un nombre para empezar a chatear.</p>
              <div className="row">
                <input
                  ref={usernameInputRef}
                  className="input"
                  value={draftUsername}
                  onChange={(e) => setDraftUsername(e.target.value)}
                  placeholder="Tu nombre"
                  type="text"
                  autoComplete="off"
                  maxLength={40}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!draftUsername.trim() || loggingIn}
                >
                  {loggingIn ? "Entrando..." : "Entrar"}
                </button>
              </div>
              {authError && <div className="form-error">{authError}</div>}
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
