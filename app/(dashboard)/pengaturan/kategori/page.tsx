import React from "react";
import { getProfile } from "@/app/actions/profiles";
import { KategoriClient } from "@/components/pengaturan/KategoriClient";

export default async function KategoriManagementPage() {
  const res = await getProfile();
  const settings = res.data || {};

  return <KategoriClient initialSettings={settings} />;
}
