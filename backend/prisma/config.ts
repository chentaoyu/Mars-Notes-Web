import { defineConfig } from "@prisma/config";
import dotenv from "dotenv";
import path from "path";

// Load .env from root directory
// __dirname in prisma/config.ts: backend/prisma
// Go up two levels to reach project root: backend/prisma -> backend -> project root
const rootDir = path.resolve(__dirname, "../..");
dotenv.config({ path: path.resolve(rootDir, ".env") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

export default defineConfig({
  datasource: {
    url: DATABASE_URL,
  },
});
