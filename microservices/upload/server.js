import express from "express";
import cors from "cors";
import multer from "multer";
import { randomUUID } from "node:crypto";
import path from "node:path";
import fs from "node:fs";

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 4000;
const uploadDir = process.env.UPLOAD_DIR || path.resolve("/data/uploads");
const publicBaseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${port}`;

fs.mkdirSync(uploadDir, { recursive: true });

app.use(cors());
app.use("/uploads", express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: "Missing file." });
    return;
  }
  const url = `${publicBaseUrl}/uploads/${req.file.filename}`;
  res.json({ url });
});

app.use((err, _req, res, _next) => {
  res.status(400).json({ message: err?.message || "Upload failed." });
});

app.listen(port, () => {
  console.log(`Upload service listening on :${port}`);
});
