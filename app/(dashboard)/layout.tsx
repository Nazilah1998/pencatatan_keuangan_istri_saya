import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { FAB } from "@/components/layout/FAB";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <TopBar />
        <main
          style={{ padding: "1.5rem 0", maxWidth: "1200px", margin: "0 auto" }}
        >
          {children}
        </main>
      </div>
      <MobileBottomNav />
      <FAB />
    </div>
  );
}
