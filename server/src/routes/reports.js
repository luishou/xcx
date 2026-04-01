const fs = require("fs");
const path = require("path");
const express = require("express");
const multer = require("multer");

const { pool } = require("../db");
const { requireAuth } = require("../middleware/auth");
const { uploadFileToCOS } = require("../services/cos");

const router = express.Router();

const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    cb(null, `hazard-${suffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("只允许上传图片文件"));
    }
  }
});
const VALID_SECTIONS = new Set(["TJ01", "TJ02"]);

router.get("/mine", requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `
        SELECT
          id,
          section_code AS section,
          description,
          images_json AS imagesJson,
          status,
          created_at AS createdAt
        FROM reports
        WHERE user_id = ?
        ORDER BY created_at DESC
      `,
      [req.user.id]
    );

    res.json({
      records: rows.map(normalizeReport)
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { section, description = "", images = [] } = req.body;

    if (!VALID_SECTIONS.has(section)) {
      return res.status(400).json({
        message: "标段不合法"
      });
    }

    if (!Array.isArray(images) || !images.length) {
      return res.status(400).json({
        message: "请至少上传一张图片"
      });
    }

    const [result] = await pool.query(
      `
        INSERT INTO reports (user_id, section_code, description, images_json)
        VALUES (?, ?, ?, ?)
      `,
      [req.user.id, section, String(description).trim().slice(0, 255), JSON.stringify(images.slice(0, 3))]
    );

    const [rows] = await pool.query(
      `
        SELECT
          r.id,
          r.section_code AS section,
          r.description,
          r.images_json AS imagesJson,
          r.status,
          r.created_at AS createdAt,
          u.nickname AS worker,
          u.avatar_url AS avatarUrl
        FROM reports r
        INNER JOIN users u ON u.id = r.user_id
        WHERE r.id = ?
        LIMIT 1
      `,
      [result.insertId]
    );

    res.status(201).json({
      report: normalizeReport(rows[0])
    });
  } catch (error) {
    next(error);
  }
});

router.post("/upload", requireAuth, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "没有收到图片文件" });
    }

    const key = `hazards/${req.user.id}/${req.file.filename}`;
    const result = await uploadFileToCOS(req.file.path, key, req.file.mimetype || "image/jpeg");

    res.json(result);
  } catch (error) {
    next(error);
  }
});

function normalizeReport(row) {
  return {
    id: row.id,
    section: row.section,
    description: row.description || "",
    images: safeParseJson(row.imagesJson, []),
    status: row.status,
    createdAt: row.createdAt,
    time: formatDate(row.createdAt),
    worker: row.worker,
    avatarUrl: row.avatarUrl
  };
}

function safeParseJson(value, fallback) {
  try {
    if (Array.isArray(value)) {
      return value;
    }
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function formatDate(value) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  const second = pad(date.getSeconds());
  return `${year}/${month}/${day} ${hour}:${minute}:${second}`;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

module.exports = router;
