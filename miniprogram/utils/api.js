const store = require("./report-store");

// 本地开发时指向 http://localhost:3300，发版前改回 production。
const API_ENV = "local";
const BASE_URL_MAP = {
  local: "http://localhost:3300",
  production: "https://safe.luishou.top"
};
const BASE_URL = BASE_URL_MAP[API_ENV];

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
    wx.request({
      url: `${BASE_URL}${options.url}`,
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
    wx.uploadFile({
      url: `${BASE_URL}/api/reports/upload`,
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

module.exports = {
  API_ENV,
  BASE_URL,
  BASE_URL_MAP,
  request,
  uploadFile
};
