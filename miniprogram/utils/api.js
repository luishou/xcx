const store = require("./report-store");

// 本地开发时指向 http://localhost:3300，发版前改回 production。
const API_ENV = "production";
const BASE_URL_MAP = {
  local: "http://localhost:3300",
  production: "https://safe.luishou.xyz"
};
const BASE_URL = BASE_URL_MAP[API_ENV];

function resolveBaseUrl() {
  try {
    const app = getApp();
    const appBaseUrl = app && app.globalData && app.globalData.baseUrl;
    if (appBaseUrl) {
      return appBaseUrl;
    }
  } catch (error) {
    // ignore and fallback
  }
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

        reject(new Error((res.data && res.data.message) || "请求失败"));
      },
      fail: reject
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

        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
          return;
        }

        reject(new Error(data.message || "上传失败"));
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
  uploadFile,
  adminFetchRecords,
  adminFetchStats,
  adminUpdateStatus,
  adminFetchMySections
};
