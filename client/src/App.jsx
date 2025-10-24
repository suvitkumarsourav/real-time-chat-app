import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import "./index.css";

const socket = io("https://real-time-chat-app-1-82af.onrender.com");


export default function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [joined, setJoined] = useState(false);
  const [userName, setUserName] = useState("");
  const [currentRoom, setCurrentRoom] = useState("");
  const [rooms, setRooms] = useState([]);
  const [activeUsersMap, setActiveUsersMap] = useState({});
  const [messagesMap, setMessagesMap] = useState({});
  const [message, setMessage] = useState("");
  const [typingPreview, setTypingPreview] = useState("");
  const [notifications, setNotifications] = useState({});

  useEffect(() => {
    socket.on("connect", () => console.log("Connected:", socket.id));

    socket.on("active-users", (users) => {
      setActiveUsersMap((prev) => ({ ...prev, [currentRoom]: users }));
    });

    socket.on("receive-message", (msg) => {
      setMessagesMap((prev) => ({
        ...prev,
        [msg.roomId]: [...(prev[msg.roomId] || []), msg],
      }));

      if (msg.roomId !== currentRoom) {
        setNotifications((prev) => ({
          ...prev,
          [msg.roomId]: (prev[msg.roomId] || 0) + 1,
        }));
      }
    });

    socket.on("user-joined", ({ userName }) => {
      setMessagesMap((prev) => ({
        ...prev,
        [currentRoom]: [
          ...(prev[currentRoom] || []),
          { text: `${userName} joined`, system: true },
        ],
      }));
    });

    socket.on("user-left", ({ userName }) => {
      setMessagesMap((prev) => ({
        ...prev,
        [currentRoom]: [
          ...(prev[currentRoom] || []),
          { text: `${userName} left`, system: true },
        ],
      }));
    });

    return () => socket.off(); // cleanup listeners on unmount
  }, [currentRoom]);

  const joinRoom = (roomName) => {
    if (!userName || !roomName) return alert("Enter name & room");
    setCurrentRoom(roomName);
    socket.emit("join-room", roomName, userName);
    setJoined(true);
    setNotifications((prev) => ({ ...prev, [roomName]: 0 }));
    if (!rooms.includes(roomName)) setRooms([...rooms, roomName]);
  };

  const sendMessage = () => {
    if (!message.trim()) return;
    const msgObj = {
      senderId: socket.id,
      senderName: userName,
      text: message,
      roomId: currentRoom,
    };
    socket.emit("send-message", msgObj);
    setMessagesMap((prev) => ({
      ...prev,
      [currentRoom]: [...(prev[currentRoom] || []), { ...msgObj, senderId: "me" }],
    }));
    setMessage("");
    setTypingPreview("");
  };

  const logout = () => {
    if (currentRoom) socket.emit("leave-room", currentRoom, userName);
    setJoined(false);
    setCurrentRoom("");
    setUserName("");
  };

  const goBackToWelcome = () => {
    logout();
    setShowWelcome(true);
  };

  /* ================= Welcome Page ================= */
  if (showWelcome) {
    return (
      <div className="welcome-container">
        <h1>Welcome to Chat App</h1>
        <p>Connect with your friends instantly, in real-time!</p>
        <button className="start-btn" onClick={() => setShowWelcome(false)}>
          Click to Start
        </button>
      </div>
    );
  }

  /* ================= Join Page ================= */
  if (!joined) {
    return (
      <div className="join-container">
        <div className="join-box">
          <h2>Join a Room</h2>
          <input
            type="text"
            placeholder="Your Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="join-input"
          />
          <select
            value={currentRoom}
            onChange={(e) => setCurrentRoom(e.target.value)}
            className="join-select"
          >
            <option value="">Select existing room</option>
            {rooms.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Or create new room"
            value={currentRoom}
            onChange={(e) => setCurrentRoom(e.target.value)}
            className="join-input"
          />
          <button className="join-btn" onClick={() => joinRoom(currentRoom)}>Join</button>
          <button className="join-btn back-btn" onClick={goBackToWelcome}>Back</button>
        </div>
      </div>
    );
  }

  /* ================= Chat Page ================= */
  return (
    <div className="app-container">
      {/* Rooms Sidebar */}
      <div className="sidebar">
        <h4>Rooms</h4>
        {rooms.map((r) => {
          const latestMsg = messagesMap[r]?.length ? messagesMap[r][messagesMap[r].length - 1].text : "";
          return (
            <div
              key={r}
              className={`room-item ${currentRoom === r ? "active" : ""}`}
              onClick={() => joinRoom(r)}
            >
              <span>{r}</span>
              {notifications[r] > 0 && <span className="notification-badge">{notifications[r]}</span>}
              <div className="latest-msg">{latestMsg}</div>
            </div>
          );
        })}
        <button className="join-btn" onClick={logout}>Logout</button>
        <button className="join-btn back-btn" onClick={goBackToWelcome}>Back</button>
      </div>

      {/* Active Users */}
      <div className="users-sidebar">
        <h4>Active Users</h4>
        {(activeUsersMap[currentRoom] || []).map((user, idx) => (
          <div key={idx} className="user-item">
            <span className="online-dot"></span>
            <span>{user}</span>
          </div>
        ))}
      </div>

      {/* Chat Area */}
      <div className="chat-area">
        <div className="messages-container">
          {(messagesMap[currentRoom] || []).map((msg, idx) => (
            <div
              key={idx}
              className={`chat-message ${msg.system ? "system" : msg.senderId === "me" ? "me" : "other"}`}
            >
              {!msg.system && msg.senderId !== "me" && (
                <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }}>
                  {msg.senderName}
                </div>
              )}
              {msg.text}
            </div>
          ))}
        </div>

        {/* Typing Preview */}
        {typingPreview && (
          <div className="typing-preview">
            <span>You: {typingPreview}</span>
          </div>
        )}

        <div className="chat-input-container">
          <input
            className="chat-input"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button className="chat-send-btn" onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}
