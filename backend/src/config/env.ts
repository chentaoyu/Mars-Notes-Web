import dotenv from "dotenv";
import path from "path";

// Load .env from root directory
// This ensures .env is loaded before any other module uses environment variables
const rootDir = path.resolve(__dirname, "../..");
const envPath = path.resolve(rootDir, "../.env");

// Only load if not already loaded (dotenv.config is idempotent but we check anyway)
if (!process.env.DOTENV_LOADED) {
  dotenv.config({ path: envPath });
  process.env.DOTENV_LOADED = "true";
}

// Validate required environment variables
const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET"] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const frontendPort = parseInt(process.env.FRONTEND_PORT || "3000", 10);
const backendPort = parseInt(process.env.BACKEND_PORT || "3001", 10);

export const env = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL!,

  // Server
  PORT: backendPort,
  NODE_ENV: process.env.NODE_ENV || "development",

  // Frontend
  FRONTEND_PORT: frontendPort,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "30d",

  CORS_ORIGIN: process.env.CORS_ORIGIN || `http://localhost:${frontendPort}`,
} as const;
