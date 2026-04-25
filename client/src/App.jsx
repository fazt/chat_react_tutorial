import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

const App = () => {
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState("");
  const [draftUsername, setDraftUsername] = useState("");
  const [text, setText] = useState("");

  const socketRef = useRef(null);
  const messageInputRef = useRef(null);
  const usernameInputRef = useRef(null);

  useEffect(() => {
    const socket = io(SERVER_URL);
    socketRef.current = socket;

    socket.on("chat:message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    usernameInputRef.current?.focus();
  }, []);

  const submitMessage = (event) => {
    event.preventDefault();
    if (!text.trim() || !username) return;

    socketRef.current?.emit("chat:message", { texto: text, usuario: username });
    setText("");
    messageInputRef.current?.focus();
  };

  const pickUsername = () => {
    if (!draftUsername.trim()) return;
    setUsername(draftUsername.trim());
    messageInputRef.current?.focus();
  };

  return (
    <div className="container">
      <div className="row">
        <div className="panel panel-chat">
          <div className="panel-heading">
            <a href="#"><em>{username || "elige un usuario"}</em></a>
            <a href="#" className="chatClose">
              <i className="fa-solid fa-xmark"></i>
            </a>
            <div className="clearfix"></div>
          </div>

          <ul className="panel-body">
            {messages.map((message, i) => (
              <li
                key={i}
                className={message.usuario === username ? "messageMe" : "messageHer"}
              >
                <img
                  src="https://api.dicebear.com/9.x/identicon/svg?seed=fazt"
                  alt=""
                />
                <span>
                  <strong style={{ paddingLeft: "7px" }}>{message.usuario}</strong>
                  : {message.texto}
                </span>
                <div className="clearfix"></div>
              </li>
            ))}
          </ul>

          <form onSubmit={submitMessage} className="panel-footer">
            <input
              ref={messageInputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={!username}
              placeholder="Escribe tu mensaje"
              type="text"
            />
            <button type="submit" disabled={!username}>
              <i className="fa-solid fa-paper-plane" aria-hidden="true"></i>
            </button>

            <input
              ref={usernameInputRef}
              value={draftUsername}
              onChange={(e) => setDraftUsername(e.target.value)}
              placeholder="Nombre de usuario"
              type="text"
            />
            <button type="button" onClick={pickUsername}>
              <i className="fa-solid fa-user" aria-hidden="true"></i>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default App;
