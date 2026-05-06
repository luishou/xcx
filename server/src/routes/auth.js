const express = require("express");
const jwt = require("jsonwebtoken");

const { pool } = require("../db");
const { parseManageSections } = require("../middleware/auth");
const { fetchWechatSession } = require("../services/wechat");

const router = express.Router();

router.post("/wechat-login", async (req, res, next) => {
  try {
    const { code, userInfo = {} } = req.body;
    if (!code) {
      return res.status(400).json({
        message: "缺少微信登录 code"
      });
    }

    const wechatSession = await fetchWechatSession(code);
    const openid = wechatSession.openid;
    const nickname = (userInfo.nickName || "").trim() || "微信用户";
    const avatarUrl = userInfo.avatarUrl || "";

    await pool.query(
      `
        INSERT INTO users (openid, nickname, avatar_url)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
          nickname = VALUES(nickname),
          avatar_url = VALUES(avatar_url)
      `,
      [openid, nickname, avatarUrl]
    );

    const [rows] = await pool.query(
      "SELECT id, openid, nickname, avatar_url AS avatarUrl, manage_sections AS manageSections FROM users WHERE openid = ? LIMIT 1",
      [openid]
    );

    const user = rows[0];
    user.manageSections = parseManageSections(user.manageSections);

    const token = jwt.sign(
      {
        userId: user.id,
        openid: user.openid
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d"
      }
    );

    return res.json({
      token,
      user
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
