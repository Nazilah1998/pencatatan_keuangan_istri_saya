import React from "react";
import { getSavings } from "@/app/actions/savings";
import { TabunganClient } from "@/components/tabungan/TabunganClient";

export default async function TabunganPage() {
  const res = await getSavings();
  const goals = res.success && res.data ? res.data : [];

  return <TabunganClient initialGoals={goals} />;
}
