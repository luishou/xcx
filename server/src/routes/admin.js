const express = require("express");

const { pool } = require("../db");

const router = express.Router();
const VALID_SECTIONS = new Set(["TJ01", "TJ02"]);
const VALID_STATUS = new Set(["待处理", "处理中", "已完成"]);

router.get("/records", async (req, res, next) => {
  try {
    const section = req.query.section;
    if (!VALID_SECTIONS.has(section)) {
      return res.status(400).json({
        message: "请选择正确的标段"
      });
    }

    const [rows] = await pool.query(
      `
        SELECT
          r.id,
          r.section_code AS section,
          r.description,
          r.images_json AS imagesJson,
          r.status,
          r.created_at AS createdAt,
          u.nickname AS worker
        FROM reports r
        INNER JOIN users u ON u.id = r.user_id
        WHERE r.section_code = ?
        ORDER BY r.created_at DESC
      `,
      [section]
    );

    const records = rows.map((row) => ({
      id: row.id,
      section: row.section,
      description: row.description || "",
      images: safeParseJson(row.imagesJson, []),
      status: row.status,
      worker: row.worker,
      time: formatDate(row.createdAt)
    }));

    res.json({ records });
  } catch (error) {
    next(error);
  }
});

router.get("/stats", async (req, res, next) => {
  try {
    const section = req.query.section;
    if (!VALID_SECTIONS.has(section)) {
      return res.status(400).json({
        message: "请选择正确的标段"
      });
    }

    const [rows] = await pool.query(
      `
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS thisWeek,
          SUM(CASE WHEN status = '待处理' THEN 1 ELSE 0 END) AS pending,
          SUM(CASE WHEN status = '处理中' THEN 1 ELSE 0 END) AS inProgress,
          SUM(CASE WHEN status = '已完成' THEN 1 ELSE 0 END) AS done
        FROM reports
        WHERE section_code = ?
      `,
      [section]
    );

    res.json({
      section,
      stats: {
        total: Number(rows[0].total || 0),
        thisWeek: Number(rows[0].thisWeek || 0),
        pending: Number(rows[0].pending || 0),
        inProgress: Number(rows[0].inProgress || 0),
        done: Number(rows[0].done || 0)
      }
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/reports/:id/status", async (req, res, next) => {
  try {
    const reportId = Number(req.params.id);
    const status = req.body.status;

    if (!reportId) {
      return res.status(400).json({
        message: "无效的记录编号"
      });
    }

    if (!VALID_STATUS.has(status)) {
      return res.status(400).json({
        message: "状态值不合法"
      });
    }

    const [result] = await pool.query(
      "UPDATE reports SET status = ? WHERE id = ?",
      [status, reportId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        message: "未找到对应记录"
      });
    }

    res.json({
      ok: true
    });
  } catch (error) {
    next(error);
  }
});

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
