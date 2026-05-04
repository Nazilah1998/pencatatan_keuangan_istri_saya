"use client";
import React from "react";

export function SessionProvider({
  children,
}: {
  children: React.ReactNode;
  session?: unknown;
}) {
  return <>{children}</>;
}
