import React from "react";
import { getProfile } from "@/app/actions/profiles";
import { TemaClient } from "@/components/pengaturan/TemaClient";

export default async function TemaPage() {
  const res = await getProfile();
  const settings = res.data || {};

  return <TemaClient initialSettings={settings} />;
}
