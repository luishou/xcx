CREATE DATABASE IF NOT EXISTS `report-dev`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_general_ci;

USE `report-dev`;

DROP TABLE IF EXISTS `reports`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `openid` VARCHAR(128) NOT NULL COMMENT '微信用户唯一标识',
  `nickname` VARCHAR(100) NOT NULL DEFAULT '微信用户' COMMENT '用户昵称',
  `avatar_url` TEXT NULL COMMENT '头像URL',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_users_openid` (`openid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='微信用户表';

-- 隐患上报记录表
CREATE TABLE `reports` (
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
