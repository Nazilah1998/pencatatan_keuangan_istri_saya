import React from "react";
import { getProfile } from "@/app/actions/profiles";
import { BahasaClient } from "@/components/pengaturan/BahasaClient";

export default async function BahasaPage() {
  const res = await getProfile();
  const settings = res.data || {};

  return <BahasaClient initialSettings={settings} />;
}
