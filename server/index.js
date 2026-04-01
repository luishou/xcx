const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config({
  path: resolveEnvPath()
});

const authRoutes = require("./src/routes/auth");
const reportRoutes = require("./src/routes/reports");
const adminRoutes = require("./src/routes/admin");
const { errorHandler } = require("./src/middleware/error-handler");

const app = express();
const port = Number(process.env.PORT || 3300);
const rootDir = path.join(__dirname, "..");

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(rootDir));

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    env: process.env.NODE_ENV || "development",
    time: new Date().toISOString()
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(rootDir, "admin.html"));
});

app.use(errorHandler);

async function start() {
  app.listen(port, () => {
    console.log(`safe-system server listening on port ${port}`);
  });
}

start().catch((error) => {
  console.error("failed to start server", error);
  process.exit(1);
});

function resolveEnvPath() {
  const projectRoot = path.join(__dirname, "..");
  const isProduction = process.env.NODE_ENV === "production";
  const candidateNames = isProduction
    ? [".env.production", ".env"]
    : [".env.local", ".env"];

  for (const fileName of candidateNames) {
    const fullPath = path.join(projectRoot, fileName);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  return path.join(projectRoot, ".env");
}
