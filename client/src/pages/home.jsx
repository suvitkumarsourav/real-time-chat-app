function Home() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",  // horizontal
        alignItems: "center",      // vertical
        height: "100%",            // 100% of parent (#root)
        flexDirection: "column",
        textAlign: "center",
      }}
    >
      <h1>Welcome to Real-time App 🚀</h1>
      <p>Enter a room to collaborate in real-time.</p>
    </div>
  );
}

export default Home;
