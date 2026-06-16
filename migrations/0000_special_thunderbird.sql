CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`email_verification_token` text NOT NULL,
	`password_hash` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);