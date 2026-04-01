const https = require("https");

function fetchWechatSession(code) {
  const query = new URLSearchParams({
    appid: process.env.WECHAT_APPID,
    secret: process.env.WECHAT_SECRET,
    js_code: code,
    grant_type: "authorization_code"
  });

  const url = `https://api.weixin.qq.com/sns/jscode2session?${query.toString()}`;

  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        let raw = "";
        response.on("data", (chunk) => {
          raw += chunk;
        });
        response.on("end", () => {
          try {
            const data = JSON.parse(raw);
            if (data.errcode) {
              reject(new Error(data.errmsg || "微信登录失败"));
              return;
            }
            resolve(data);
          } catch (error) {
            reject(error);
          }
        });
      })
      .on("error", reject);
  });
}

module.exports = {
  fetchWechatSession
};
