import "./config/env"; // Ensure env is loaded first
import { env } from "./config/env";
import { createApp } from "./app";

const PORT = env.PORT;

const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
  });
});
