import React from "react";
import { getProfile } from "@/app/actions/profiles";
import { PreferensiClient } from "@/components/pengaturan/PreferensiClient";

export default async function PreferensiPage() {
  const res = await getProfile();
  const settings = res.data || {};

  return <PreferensiClient initialSettings={settings} />;
}
