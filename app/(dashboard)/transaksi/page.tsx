import React from "react";
import { getTransactions } from "@/app/actions/transactions";
import { TransaksiClient } from "@/components/transaksi/TransaksiClient";

import { getProfile } from "@/app/actions/profiles";

export default async function TransaksiPage() {
  const [res, profileRes] = await Promise.all([
    getTransactions(),
    getProfile(),
  ]);
  const transactions = res.success && res.data ? res.data : [];

  return (
    <TransaksiClient
      initialTransactions={transactions}
      initialSettings={profileRes.data}
    />
  );
}
