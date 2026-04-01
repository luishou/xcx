const jwt = require("jsonwebtoken");
const { pool } = require("../db");

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (!token) {
      return res.status(401).json({
        message: "缺少登录令牌"
      });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await pool.query(
      "SELECT id, openid, nickname, avatar_url AS avatarUrl FROM users WHERE id = ? LIMIT 1",
      [payload.userId]
    );

    if (!rows.length) {
      return res.status(401).json({
        message: "登录状态无效"
      });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  requireAuth
};
