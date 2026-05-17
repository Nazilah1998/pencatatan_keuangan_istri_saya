import React, { Suspense } from "react";
import { getTransactions } from "@/app/actions/transactions";
import { TransaksiClient } from "@/components/transaksi/TransaksiClient";
import { getProfile } from "@/app/actions/profiles";
import { SkeletonLoader } from "@/components/ui/SkeletonLoader";

function TransaksiLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", width: "100%" }}>
      {/* Header Skeleton */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "60%" }}>
          <SkeletonLoader variant="text" width="200px" height="32px" />
          <SkeletonLoader variant="text" width="300px" height="18px" />
        </div>
        <SkeletonLoader variant="circle" width="48px" height="48px" />
      </div>

      {/* Quick Filters Placeholder */}
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <SkeletonLoader variant="text" width="100px" height="36px" style={{ borderRadius: "20px" }} />
        <SkeletonLoader variant="text" width="100px" height="36px" style={{ borderRadius: "20px" }} />
        <SkeletonLoader variant="text" width="100px" height="36px" style={{ borderRadius: "20px" }} />
      </div>

      {/* Transactions List Placeholder */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
        <SkeletonLoader variant="text" width="140px" height="20px" />
        <SkeletonLoader variant="list" count={4} />
      </div>
    </div>
  );
}

export default async function TransaksiPage() {
  const [res, profileRes] = await Promise.all([
    getTransactions(),
    getProfile(),
  ]);
  const transactions = res.success && res.data ? res.data : [];

  return (
    <Suspense fallback={<TransaksiLoading />}>
      <TransaksiClient
        initialTransactions={transactions}
        initialSettings={profileRes.data}
      />
    </Suspense>
  );
}

