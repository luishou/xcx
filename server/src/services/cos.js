const fs = require("fs");
const COS = require("cos-nodejs-sdk-v5");

let client = null;

function getClient() {
  if (client) return client;
  if (!process.env.COS_SECRET_ID || !process.env.COS_SECRET_KEY) {
    throw new Error("COS SecretId/SecretKey 未配置");
  }
  client = new COS({
    SecretId: process.env.COS_SECRET_ID,
    SecretKey: process.env.COS_SECRET_KEY
  });
  return client;
}

/**
 * 将本地文件流式上传到 COS，上传后自动删除临时文件。
 * @param {string} localPath  临时文件绝对路径
 * @param {string} key        COS 对象键（不含开头斜杠）
 * @param {string} contentType
 * @returns {{ key: string, url: string }}
 */
function uploadFileToCOS(localPath, key, contentType) {
  const cosKey = key.replace(/^\/+/, "");
  const bucket = process.env.COS_BUCKET;
  const region = process.env.COS_REGION;

  if (!bucket || !region) {
    throw new Error("COS_BUCKET / COS_REGION 未配置");
  }

  return new Promise((resolve, reject) => {
    getClient().putObject(
      {
        Bucket: bucket,
        Region: region,
        Key: cosKey,
        Body: fs.createReadStream(localPath),
        ContentType: contentType || "image/jpeg"
      },
      (error, data) => {
        // 无论成功失败，删除本地临时文件
        fs.unlink(localPath, () => {});

        if (error) {
          reject(error);
          return;
        }

        resolve({
          key: cosKey,
          url: `https://${data.Location}`
        });
      }
    );
  });
}

module.exports = { uploadFileToCOS };
