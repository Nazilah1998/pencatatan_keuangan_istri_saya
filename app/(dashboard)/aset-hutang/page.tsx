import React from "react";
import { getAssets, getDebts } from "@/app/actions/assets";
import { AsetHutangClient } from "@/components/aset-hutang/AsetHutangClient";

export default async function AsetHutangPage() {
  const [aRes, dRes] = await Promise.all([getAssets(), getDebts()]);

  const assets = aRes.success && aRes.data ? aRes.data : [];
  const debts = dRes.success && dRes.data ? dRes.data : [];

  return <AsetHutangClient initialAssets={assets} initialDebts={debts} />;
}
