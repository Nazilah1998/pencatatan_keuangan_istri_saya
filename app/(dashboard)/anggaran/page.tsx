import React from "react";
import { getBudgets } from "@/app/actions/budgets";
import { getTransactions } from "@/app/actions/transactions";
import { AnggaranClient } from "@/components/anggaran/AnggaranClient";

export default async function AnggaranPage() {
  const [bRes, tRes] = await Promise.all([getBudgets(), getTransactions()]);

  const budgets = bRes.success && bRes.data ? bRes.data : [];
  const transactions = tRes.success && tRes.data ? tRes.data : [];

  return (
    <AnggaranClient
      initialBudgets={budgets}
      initialTransactions={transactions}
    />
  );
}
