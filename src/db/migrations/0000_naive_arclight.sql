CREATE TABLE `loans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`loan_number` text NOT NULL,
	`principal_amount` real NOT NULL,
	`interest_rate` real NOT NULL,
	`interest_amount` real DEFAULT 0 NOT NULL,
	`total_amount` real NOT NULL,
	`paid_amount` real DEFAULT 0 NOT NULL,
	`balance` real NOT NULL,
	`term_months` integer NOT NULL,
	`installment_amount` real NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`purpose` text,
	`guarantor_1_id` integer,
	`guarantor_2_id` integer,
	`applied_at` integer,
	`approved_at` integer,
	`disbursed_at` integer,
	`due_date` integer,
	`completed_at` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`guarantor_1_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`guarantor_2_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `loans_loan_number_unique` ON `loans` (`loan_number`);--> statement-breakpoint
CREATE INDEX `idx_loans_member_id` ON `loans` (`member_id`);--> statement-breakpoint
CREATE INDEX `idx_loans_loan_number` ON `loans` (`loan_number`);--> statement-breakpoint
CREATE INDEX `idx_loans_status` ON `loans` (`status`);--> statement-breakpoint
CREATE INDEX `idx_loans_due_date` ON `loans` (`due_date`);--> statement-breakpoint
CREATE INDEX `idx_loans_disbursed_at` ON `loans` (`disbursed_at`);--> statement-breakpoint
CREATE TABLE `members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_number` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`email` text,
	`phone` text,
	`id_number` text,
	`date_of_birth` integer,
	`address` text,
	`joined_at` integer,
	`is_active` integer DEFAULT true,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `members_member_number_unique` ON `members` (`member_number`);--> statement-breakpoint
CREATE INDEX `idx_members_member_number` ON `members` (`member_number`);--> statement-breakpoint
CREATE INDEX `idx_members_is_active` ON `members` (`is_active`);--> statement-breakpoint
CREATE INDEX `idx_members_joined_at` ON `members` (`joined_at`);--> statement-breakpoint
CREATE TABLE `reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`report_type` text NOT NULL,
	`period_start` integer NOT NULL,
	`period_end` integer NOT NULL,
	`report_data` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`generated_at` integer,
	`generated_by` text,
	`error_message` text,
	`created_at` integer
);
--> statement-breakpoint
CREATE INDEX `idx_reports_report_type` ON `reports` (`report_type`);--> statement-breakpoint
CREATE INDEX `idx_reports_period_start` ON `reports` (`period_start`);--> statement-breakpoint
CREATE INDEX `idx_reports_period_end` ON `reports` (`period_end`);--> statement-breakpoint
CREATE INDEX `idx_reports_status` ON `reports` (`status`);--> statement-breakpoint
CREATE TABLE `savings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`account_number` text NOT NULL,
	`savings_type` text DEFAULT 'ordinary' NOT NULL,
	`balance` real DEFAULT 0 NOT NULL,
	`interest_rate` real DEFAULT 0,
	`opened_at` integer,
	`is_active` integer DEFAULT true,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_savings_member_id` ON `savings` (`member_id`);--> statement-breakpoint
CREATE INDEX `idx_savings_account_number` ON `savings` (`account_number`);--> statement-breakpoint
CREATE INDEX `idx_savings_is_active` ON `savings` (`is_active`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`value` text,
	`description` text,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `settings_key_unique` ON `settings` (`key`);--> statement-breakpoint
CREATE INDEX `idx_settings_key` ON `settings` (`key`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer,
	`savings_id` integer,
	`loan_id` integer,
	`transaction_number` text NOT NULL,
	`transaction_type` text NOT NULL,
	`amount` real NOT NULL,
	`balance_after` real NOT NULL,
	`reference` text,
	`description` text,
	`transaction_date` integer,
	`recorded_at` integer,
	`recorded_by` text,
	`is_reversed` integer DEFAULT false,
	`created_at` integer,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`savings_id`) REFERENCES `savings`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`loan_id`) REFERENCES `loans`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `transactions_transaction_number_unique` ON `transactions` (`transaction_number`);--> statement-breakpoint
CREATE INDEX `idx_transactions_member_id` ON `transactions` (`member_id`);--> statement-breakpoint
CREATE INDEX `idx_transactions_savings_id` ON `transactions` (`savings_id`);--> statement-breakpoint
CREATE INDEX `idx_transactions_loan_id` ON `transactions` (`loan_id`);--> statement-breakpoint
CREATE INDEX `idx_transactions_transaction_date` ON `transactions` (`transaction_date`);--> statement-breakpoint
CREATE INDEX `idx_transactions_transaction_type` ON `transactions` (`transaction_type`);--> statement-breakpoint
CREATE INDEX `idx_transactions_transaction_number` ON `transactions` (`transaction_number`);