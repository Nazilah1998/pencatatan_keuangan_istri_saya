import React from "react";
import { getProfile } from "@/app/actions/profiles";
import { DompetClient } from "@/components/pengaturan/DompetClient";

export default async function DompetManagementPage() {
  const res = await getProfile();
  const settings = res.data || {};

  return <DompetClient initialSettings={settings} />;
}
