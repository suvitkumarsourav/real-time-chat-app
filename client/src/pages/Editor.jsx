import { useParams } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { useState, useEffect } from "react";

function Editor() {
  const { roomId } = useParams();
  const { socket } = useSocket();
  const [code, setCode] = useState("");

  // Receive updates from server
  useEffect(() => {
    if (!socket) return;

    socket.on("code-update", (newCode) => {
      setCode(newCode);
    });

    return () => socket.off("code-update");
  }, [socket]);

  // Send updates to server
  const handleChange = (e) => {
    setCode(e.target.value);
    socket.emit("code-update", e.target.value, roomId);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Room: {roomId}</h2>
      <textarea
        value={code}
        onChange={handleChange}
        style={{ width: "100%", height: "70vh", fontSize: "16px" }}
      />
    </div>
  );
}

export default Editor;
