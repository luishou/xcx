const store = require("./report-store");

/**
 * 运行环境：develop（开发者工具/预览调试）→ local；trial/release → production。
 * 无需发版前手改 API_ENV；本地调试需在微信开发者工具勾选「不校验合法域名」。
 */
function detectApiEnv() {
  try {
    const accountInfo = typeof wx.getAccountInfoSync === "function" ? wx.getAccountInfoSync() : null;
    const envVersion = accountInfo && accountInfo.miniProgram && accountInfo.miniProgram.envVersion;
    return envVersion === "develop" ? "local" : "production";
  } catch (e) {
    return "production";
  }
}

const API_ENV = detectApiEnv();
const BASE_URL_MAP = {
  local: "http://localhost:3300",
  production: "https://safe.luishou.xyz"
};
const BASE_URL = BASE_URL_MAP[API_ENV] || BASE_URL_MAP.production;

function resolveBaseUrl() {
  return BASE_URL;
}

function request(options) {
  const method = options.method || "GET";
  const header = {
    "content-type": "application/json"
  };

  if (options.auth) {
    const token = store.getToken();
    if (token) {
      header.Authorization = `Bearer ${token}`;
    }
  }

  return new Promise((resolve, reject) => {
    const baseUrl = resolveBaseUrl();
    wx.request({
      url: `${baseUrl}${options.url}`,
      method,
      data: options.data,
      header,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
          return;
        }

        if (res.statusCode === 401) {
          store.clearSession();
          reject(new Error("登录已失效，请重新授权"));
          return;
        }

        reject(new Error((res.data && res.data.message) || "请求失败"));
      },
      fail: reject
    });
  });
}

/**
 * wx.login + /api/auth/wechat-login，写入 store，返回当前用户对象
 * @param {{ nickName: string, avatarUrl?: string }} userInfo
 */
function loginWithWeChat(userInfo) {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (!res.code) {
          reject(new Error("未拿到微信登录 code"));
          return;
        }
        request({
          url: "/api/auth/wechat-login",
          method: "POST",
          data: { code: res.code, userInfo }
        })
          .then((result) => {
            if (!result || !result.token || !result.user) {
              reject(new Error("登录响应无效"));
              return;
            }
            store.setToken(result.token);
            store.setCurrentUser({
              id: result.user.id,
              name: result.user.nickname,
              avatarUrl: result.user.avatarUrl,
              manageSections: Array.isArray(result.user.manageSections)
                ? result.user.manageSections
                : []
            });
            resolve(store.getCurrentUser());
          })
          .catch(reject);
      },
      fail: () => reject(new Error("微信登录失败"))
    });
  });
}

function uploadFile(filePath) {
  const token = store.getToken();

  return new Promise((resolve, reject) => {
    const baseUrl = resolveBaseUrl();
    wx.uploadFile({
      url: `${baseUrl}/api/reports/upload`,
      filePath,
      name: "file",
      header: {
        Authorization: `Bearer ${token}`
      },
      success: (res) => {
        let data;
        try {
          data = JSON.parse(res.data);
        } catch (error) {
          reject(error);
          return;
        }

        if (res.statusCode === 401) {
          store.clearSession();
          reject(new Error("登录已失效，请重新授权"));
          return;
        }

        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
          return;
        }

        reject(new Error((data && data.message) || "上传失败"));
      },
      fail: reject
    });
  });
}

function adminFetchRecords(section) {
  return request({
    url: `/api/admin/records?section=${encodeURIComponent(section)}`,
    auth: true
  });
}

function adminFetchStats(section) {
  return request({
    url: `/api/admin/stats?section=${encodeURIComponent(section)}`,
    auth: true
  });
}

function adminUpdateStatus(id, status) {
  return request({
    url: `/api/admin/reports/${id}/status`,
    method: "PATCH",
    data: { status },
    auth: true
  });
}

function adminFetchMySections() {
  return request({
    url: "/api/admin/me/sections",
    auth: true
  });
}

module.exports = {
  API_ENV,
  BASE_URL,
  BASE_URL_MAP,
  request,
  loginWithWeChat,
  uploadFile,
  adminFetchRecords,
  adminFetchStats,
  adminUpdateStatus,
  adminFetchMySections
};
