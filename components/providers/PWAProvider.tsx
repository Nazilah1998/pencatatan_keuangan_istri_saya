"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

// Define the official type for the PWA install prompt event
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAContextType {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstallable: boolean;
  isIOS: boolean;
  installApp: () => void;
}

const PWAContext = createContext<PWAContextType>({
  deferredPrompt: null,
  isInstallable: false,
  isIOS: false,
  installApp: () => {},
});

export const usePWA = () => useContext(PWAContext);

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const timer = requestAnimationFrame(() => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIosDevice =
        /iphone|ipad|ipod/.test(userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      setIsIOS(isIosDevice);
    });

    const handleBeforeInstallPrompt = (e: Event) => {
      // Cast to the specific PWA event type
      const installEvent = e as BeforeInstallPromptEvent;

      // Prevent the mini-infobar from appearing on mobile
      installEvent.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(installEvent);
      // Update UI notify the user they can install the PWA
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      cancelAnimationFrame(timer);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
    } else {
      console.log("User dismissed the install prompt");
    }

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return (
    <PWAContext.Provider
      value={{ deferredPrompt, isInstallable, isIOS, installApp }}
    >
      {children}
    </PWAContext.Provider>
  );
}
