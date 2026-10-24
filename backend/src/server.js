import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import "./db.js";

import authRoutes from "./routes/auth.js";
import projectRoutes from "./routes/projects.js";
import exportRoutes from "./routes/export.js";
import dashboardAuthRoutes from "./routes/dashboardAuth.js";
import dashboardCredentialsRoutes from "./routes/dashboardCredentials.js";

const app = express();
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/projects", exportRoutes); // adds POST /:id/export
app.use("/auth", dashboardAuthRoutes); // /auth/verify, /auth/verify-token — legacy browser-redirect flow, kept but no longer generated into new exports
app.use("/auth", dashboardCredentialsRoutes); // /auth/verify-credentials — called server-to-server by infrakit-dashboard-login.js

app.get("/health", (req, res) => res.json({ ok: true }));

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`InfraKit Visual Editor backend on :${port}`));
