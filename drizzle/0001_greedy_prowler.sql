CREATE TABLE `ppt_slides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`slideIndex` int NOT NULL,
	`title` varchar(500),
	`content` text,
	`htmlContent` text,
	`style` varchar(50) DEFAULT 'minimalism',
	`layoutMeta` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ppt_slides_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL DEFAULT '未命名项目',
	`description` text,
	`type` enum('article','table','layout','ppt') NOT NULL DEFAULT 'article',
	`status` enum('draft','completed') NOT NULL DEFAULT 'draft',
	`content` text,
	`meta` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `uploads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int,
	`filename` varchar(500) NOT NULL,
	`originalName` varchar(500) NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`size` int NOT NULL,
	`storageKey` varchar(1000) NOT NULL,
	`storageUrl` varchar(1000) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `uploads_id` PRIMARY KEY(`id`)
);
