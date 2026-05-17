import { relations } from "drizzle-orm/relations";
import {
  usersInAuth,
  transactions,
  budgets,
  savings,
  assets,
  debts,
  profiles,
} from "./schema";

export const transactionsRelations = relations(transactions, ({ one }) => ({
  usersInAuth: one(usersInAuth, {
    fields: [transactions.userId],
    references: [usersInAuth.id],
  }),
}));

export const usersInAuthRelations = relations(usersInAuth, ({ many }) => ({
  transactions: many(transactions),
  budgets: many(budgets),
  savings: many(savings),
  assets: many(assets),
  debts: many(debts),
  profiles: many(profiles),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
  usersInAuth: one(usersInAuth, {
    fields: [budgets.userId],
    references: [usersInAuth.id],
  }),
}));

export const savingsRelations = relations(savings, ({ one }) => ({
  usersInAuth: one(usersInAuth, {
    fields: [savings.userId],
    references: [usersInAuth.id],
  }),
}));

export const assetsRelations = relations(assets, ({ one }) => ({
  usersInAuth: one(usersInAuth, {
    fields: [assets.userId],
    references: [usersInAuth.id],
  }),
}));

export const debtsRelations = relations(debts, ({ one }) => ({
  usersInAuth: one(usersInAuth, {
    fields: [debts.userId],
    references: [usersInAuth.id],
  }),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  usersInAuth: one(usersInAuth, {
    fields: [profiles.id],
    references: [usersInAuth.id],
  }),
}));
