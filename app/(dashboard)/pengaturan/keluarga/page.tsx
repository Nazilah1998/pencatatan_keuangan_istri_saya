import React from "react";
import { FamilyClient } from "@/components/pengaturan/FamilyClient";
import { getFamilyCode } from "@/app/actions/family";

export default async function KeluargaPage() {
  const res = await getFamilyCode();
  
  if (!res.success || !res.code) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Gagal memuat data keluarga: {res.error}</div>;
  }

  return (
    <FamilyClient 
      familyCode={res.code} 
      isOwner={res.isOwner || false} 
      members={res.members || []} 
    />
  );
}
