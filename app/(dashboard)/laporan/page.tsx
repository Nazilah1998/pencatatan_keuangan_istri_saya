import React from "react";
import { getTransactions } from "@/app/actions/transactions";
import { LaporanClient } from "@/components/laporan/LaporanClient";

export default async function LaporanPage() {
  const res = await getTransactions();
  const transactions = res.success && res.data ? res.data : [];

  return <LaporanClient initialTransactions={transactions} />;
}
