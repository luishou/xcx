# 隐患随手拍

一个用于施工现场隐患上报的微信小程序项目，包含：

- 微信小程序前端：工友拍照上报隐患
- Node.js 后端服务：登录、图片上传、隐患上报、后台接口
- Admin 后台网页：按标段查看记录、统计、处理状态

## 项目结构

```text
xcx/
├── miniprogram/           # 微信小程序
│   ├── pages/index/       # 登录页
│   ├── pages/section/     # 标段选择页
│   ├── pages/report/      # 隐患上报页
│   └── utils/             # 小程序接口与本地会话封装
├── server/                # Node.js 后端
│   ├── src/routes/        # 接口路由
│   ├── src/services/      # 微信/COS 服务封装
│   ├── src/middleware/    # 中间件
│   └── index.js           # 服务启动入口
├── admin.html             # 后台网页
├── schema.sql             # 可直接执行的建表 SQL
├── DB_SCHEMA.md           # 表结构说明文档
├── .env.local.example      # 本地开发环境变量示例
├── .env.production.example # 生产环境变量示例
└── package.json           # Node 依赖与启动脚本
```

## 功能说明

### 小程序端

- 微信授权登录
- 选择标段：`TJ01` / `TJ02`
- 上传最多 3 张现场图片
- 填写隐患描述
- 提交隐患上报

### 后台网页

- 选择标段进入后台
- 查看当前标段上报记录
- 查看统计数据
- 修改处理状态：
  - `待处理`
  - `处理中`
  - `已完成`

### 后端接口

- `GET /api/health`
- `POST /api/auth/wechat-login`
- `POST /api/reports/upload`
- `POST /api/reports`
- `GET /api/reports/mine`
- `GET /api/admin/records?section=TJ01`
- `GET /api/admin/stats?section=TJ01`
- `PATCH /api/admin/reports/:id/status`

## 技术栈

- 小程序原生开发
- Node.js
- Express
- MySQL
- JWT
- 腾讯云 COS

## 环境变量

服务端会自动按环境读取：

- 开发环境优先读取 `.env.local`
- 生产环境优先读取 `.env.production`
- 如果对应文件不存在，则回退到 `.env`

示例文件：

- [`.env.local.example`](/Users/luishou/code/xcx/.env.local.example)
- [`.env.production.example`](/Users/luishou/code/xcx/.env.production.example)

### 本地开发配置

本地开发要求域名指向 `localhost` 时，可使用：

```env
WECHAT_APPID=your_wechat_appid
WECHAT_SECRET=your_wechat_secret

PORT=3300
NODE_ENV=development
BASE_URL=http://localhost:3300

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_local_db_password
DB_NAME=xcx

JWT_SECRET=replace_with_your_local_jwt_secret
JWT_EXPIRES_IN=7d

COS_SECRET_ID=your_cos_secret_id
COS_SECRET_KEY=your_cos_secret_key
COS_BUCKET=your_bucket_name
COS_REGION=ap-shanghai
```

### 生产环境配置

```env
WECHAT_APPID=your_wechat_appid
WECHAT_SECRET=your_wechat_secret

PORT=3300
NODE_ENV=production
BASE_URL=https://safe.luishou.xyz

DB_HOST=your_prod_db_host
DB_PORT=3306
DB_USER=your_prod_db_user
DB_PASSWORD=your_prod_db_password
DB_NAME=xcx

JWT_SECRET=replace_with_your_prod_jwt_secret
JWT_EXPIRES_IN=7d

COS_SECRET_ID=your_cos_secret_id
COS_SECRET_KEY=your_cos_secret_key
COS_BUCKET=your_bucket_name
COS_REGION=ap-shanghai
```

## 安装与启动

### 1. 安装依赖

```bash
npm install
```

### 2. 启动后端

开发环境：

```bash
npm run dev
```

建议先把 [`.env.local.example`](/Users/luishou/code/xcx/.env.local.example) 复制为 `.env.local`。

生产环境：

```bash
npm start
```

建议先把 [`.env.production.example`](/Users/luishou/code/xcx/.env.production.example) 复制为 `.env.production`。

默认端口：

```text
3300
```

启动后访问：

- 后台首页：[http://localhost:3300](http://localhost:3300)
- 健康检查：[http://localhost:3300/api/health](http://localhost:3300/api/health)

## 微信小程序配置

小程序项目配置文件：

- [project.config.json](/Users/luishou/code/xcx/project.config.json)
- [miniprogram/app.json](/Users/luishou/code/xcx/miniprogram/app.json)

当前页面路由：

- `pages/index/index`
- `pages/section/index`
- `pages/report/index`

微信公众平台需要配置的域名：

- `request` 合法域名：`https://safe.luishou.xyz`
- `uploadFile` 合法域名：`https://safe.luishou.xyz`

如果本地联调要走 `localhost`：

- 服务端 `BASE_URL` 用 `http://localhost:3300`
- 后台网页访问地址用 `http://localhost:3300`
- 小程序端接口地址在 [api.js](/Users/luishou/code/xcx/miniprogram/utils/api.js) 里把 `API_ENV` 切到 `local`

如果实际部署域名变化，需要同时修改：

- 小程序端接口地址
- 微信后台合法域名配置
- `.env.production` 中的 `BASE_URL`

## 数据库说明

数据库名：

```sql
xcx
```

当前使用两张核心表：

- `users`
- `reports`

建表文件：

- [schema.sql](/Users/luishou/code/xcx/schema.sql)
- [DB_SCHEMA.md](/Users/luishou/code/xcx/DB_SCHEMA.md)

如果你要手动同步到 MySQL，优先执行：

```sql
schema.sql
```

服务启动时不会自动建表，表结构需要你手动同步到 MySQL。

## 接口与数据流

### 登录流程

1. 小程序调用 `wx.login`
2. 前端请求 `POST /api/auth/wechat-login`
3. 后端调用微信 `jscode2session`
4. 写入或更新 `users`
5. 返回 JWT 给小程序

### 上报流程

1. 小程序选择图片
2. 前端调用 `POST /api/reports/upload`
3. 后端上传文件到 COS
4. 前端拿到图片 URL 后调用 `POST /api/reports`
5. 后端写入 `reports`

### 后台流程

1. Admin 页面按标段调用 `GET /api/admin/records`
2. Admin 页面调用 `GET /api/admin/stats`
3. 修改状态时调用 `PATCH /api/admin/reports/:id/status`

## 关键文件

### 后端

- 启动入口：[server/index.js](/Users/luishou/code/xcx/server/index.js)
- 微信登录：[server/src/routes/auth.js](/Users/luishou/code/xcx/server/src/routes/auth.js)
- 上报接口：[server/src/routes/reports.js](/Users/luishou/code/xcx/server/src/routes/reports.js)
- 后台接口：[server/src/routes/admin.js](/Users/luishou/code/xcx/server/src/routes/admin.js)

### 小程序

- 登录页：[miniprogram/pages/index/index.js](/Users/luishou/code/xcx/miniprogram/pages/index/index.js)
- 标段页：[miniprogram/pages/section/index.js](/Users/luishou/code/xcx/miniprogram/pages/section/index.js)
- 上报页：[miniprogram/pages/report/index.js](/Users/luishou/code/xcx/miniprogram/pages/report/index.js)
- 接口封装：[miniprogram/utils/api.js](/Users/luishou/code/xcx/miniprogram/utils/api.js)

### 后台网页

- [admin.html](/Users/luishou/code/xcx/admin.html)

## 已清理项

- 已移除早期网页原型 `index.html`
- 已移除小程序目录下重复的开发者工具配置
- 根目录 `project.config.json` 作为当前唯一有效的小程序项目配置

## 当前状态

已完成：

- 小程序页面结构
- 后端接口骨架
- MySQL 建表脚本
- Admin 接口对接

当前需要继续确认的内容：

- 数据库实例是否已放通当前服务端访问权限
- 微信公众平台合法域名是否已配置
- COS 存储桶权限和回源地址是否符合预期

## 注意事项

- `.env` 中包含敏感配置，不要提交到公开仓库
- 微信密钥、数据库密码、COS 密钥建议单独保管
- 如果密钥已经暴露，建议立即轮换

## 后续建议

- 增加后台管理员登录鉴权
- 增加“小程序我的上报记录”页面
- 增加分页、筛选和搜索
- 增加图片压缩与失败重试
- 增加操作日志和审计字段
