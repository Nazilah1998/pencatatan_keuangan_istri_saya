ALTER TABLE "budgets" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "savings" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_assets_user_id" ON "assets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_budgets_user_id" ON "budgets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_budgets_periode" ON "budgets" USING btree ("periode");--> statement-breakpoint
CREATE INDEX "idx_debts_user_id" ON "debts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_savings_user_id" ON "savings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_transactions_user_id" ON "transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_transactions_tanggal" ON "transactions" USING btree ("tanggal");