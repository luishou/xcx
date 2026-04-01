# MySQL 表结构文档

适用项目：隐患随手拍  
数据库名：`xcx`

## 1. 建库语句

```sql
CREATE DATABASE IF NOT EXISTS `xcx`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_general_ci;

USE `xcx`;
```

## 2. 表清单

- `users`：微信小程序用户表
- `reports`：隐患上报记录表

## 3. 建表 SQL

### 3.1 users

用途：
存储微信登录用户的基础信息，一个 `openid` 只对应一条用户记录。

```sql
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `openid` VARCHAR(128) NOT NULL COMMENT '微信用户唯一标识',
  `nickname` VARCHAR(100) NOT NULL DEFAULT '微信用户' COMMENT '用户昵称',
  `avatar_url` TEXT NULL COMMENT '头像URL',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_users_openid` (`openid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='微信用户表';
```

字段说明：

| 字段名 | 类型 | 允许空 | 默认值 | 说明 |
|---|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | 否 | 自增 | 主键 |
| `openid` | `VARCHAR(128)` | 否 | 无 | 微信唯一标识 |
| `nickname` | `VARCHAR(100)` | 否 | `微信用户` | 用户昵称 |
| `avatar_url` | `TEXT` | 是 | `NULL` | 用户头像地址 |
| `created_at` | `DATETIME` | 否 | `CURRENT_TIMESTAMP` | 创建时间 |
| `updated_at` | `DATETIME` | 否 | `CURRENT_TIMESTAMP` | 更新时间 |

索引说明：

- 主键：`PRIMARY KEY (id)`
- 唯一索引：`uniq_users_openid (openid)`

### 3.2 reports

用途：
存储小程序端提交的隐患上报记录，关联到 `users.id`。

```sql
CREATE TABLE IF NOT EXISTS `reports` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '上报用户ID，关联users.id',
  `section_code` VARCHAR(16) NOT NULL COMMENT '标段编码，当前支持TJ01/TJ02',
  `description` VARCHAR(255) NOT NULL DEFAULT '' COMMENT '隐患描述',
  `images_json` JSON NOT NULL COMMENT '图片URL数组JSON',
  `status` ENUM('待处理','处理中','已完成') NOT NULL DEFAULT '待处理' COMMENT '处理状态',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_reports_section` (`section_code`),
  KEY `idx_reports_status` (`status`),
  KEY `idx_reports_created` (`created_at`),
  CONSTRAINT `fk_reports_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='隐患上报记录表';
```

字段说明：

| 字段名 | 类型 | 允许空 | 默认值 | 说明 |
|---|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | 否 | 自增 | 主键 |
| `user_id` | `BIGINT UNSIGNED` | 否 | 无 | 关联用户ID |
| `section_code` | `VARCHAR(16)` | 否 | 无 | 标段编码，当前使用 `TJ01`、`TJ02` |
| `description` | `VARCHAR(255)` | 否 | 空字符串 | 隐患描述 |
| `images_json` | `JSON` | 否 | 无 | 图片地址数组，例如 `["https://.../1.jpg","https://.../2.jpg"]` |
| `status` | `ENUM('待处理','处理中','已完成')` | 否 | `待处理` | 处理状态 |
| `created_at` | `DATETIME` | 否 | `CURRENT_TIMESTAMP` | 创建时间 |
| `updated_at` | `DATETIME` | 否 | `CURRENT_TIMESTAMP` | 更新时间 |

索引说明：

- 主键：`PRIMARY KEY (id)`
- 普通索引：`idx_reports_section (section_code)`
- 普通索引：`idx_reports_status (status)`
- 普通索引：`idx_reports_created (created_at)`
- 外键：`fk_reports_user (user_id -> users.id)`

## 4. 推荐执行顺序

```sql
USE `xcx`;

CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `openid` VARCHAR(128) NOT NULL,
  `nickname` VARCHAR(100) NOT NULL DEFAULT '微信用户',
  `avatar_url` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_users_openid` (`openid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `reports` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `section_code` VARCHAR(16) NOT NULL,
  `description` VARCHAR(255) NOT NULL DEFAULT '',
  `images_json` JSON NOT NULL,
  `status` ENUM('待处理','处理中','已完成') NOT NULL DEFAULT '待处理',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reports_section` (`section_code`),
  KEY `idx_reports_status` (`status`),
  KEY `idx_reports_created` (`created_at`),
  CONSTRAINT `fk_reports_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## 5. 业务约束说明

- `users.openid` 必须唯一
- `reports.section_code` 当前后端只接受 `TJ01`、`TJ02`
- `reports.status` 当前只允许：
  - `待处理`
  - `处理中`
  - `已完成`
- `reports.images_json` 最多按当前接口逻辑保存 3 张图片地址
- `reports.description` 当前接口层会截断到 255 字以内

## 6. 对应代码位置

- 手动建表 SQL：[schema.sql](/Users/luishou/code/xcx/schema.sql)
- 微信登录写入用户：[auth.js](/Users/luishou/code/xcx/server/src/routes/auth.js)
- 上报记录写入逻辑：[reports.js](/Users/luishou/code/xcx/server/src/routes/reports.js)
