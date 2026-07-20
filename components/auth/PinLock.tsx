"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Lock, Delete, Fingerprint } from "lucide-react";
import toast from "react-hot-toast";

export function PinLock({ children }: { children: React.ReactNode }) {
  const { pinCode, isLocked, setIsLocked } = useAppStore();
  const [inputPin, setInputPin] = useState("");
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (inputPin.length === 4) {
      if (inputPin === pinCode) {
        setIsLocked(false);
        setInputPin("");
      } else {
        setError(true);
        toast.error("PIN salah!");
        setTimeout(() => {
          setInputPin("");
          setError(false);
        }, 500);
      }
    }
  }, [inputPin, pinCode, setIsLocked]);

  if (!mounted) return null;

  // Render children normally if not locked or no PIN is set
  if (!pinCode || !isLocked) {
    return <>{children}</>;
  }

  const handleKeyPress = (num: string) => {
    if (inputPin.length < 4) {
      setInputPin((prev) => prev + num);
      setError(false);
    }
  };

  const handleDelete = () => {
    setInputPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <>
      {/* Background Content (Blurred) */}
      <div style={{ filter: "blur(8px)", pointerEvents: "none" }}>
        {children}
      </div>

      {/* Lock Screen Overlay */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "var(--color-surface)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          animation: "fadeIn 0.3s ease",
        }}
      >
        <div
          style={{
            background: "rgba(255, 133, 162, 0.1)",
            padding: "1rem",
            borderRadius: "50%",
            marginBottom: "1.5rem",
          }}
        >
          <Lock size={32} color="var(--color-primary)" />
        </div>
        
        <h2 style={{ margin: "0 0 0.5rem 0", color: "var(--color-text)", fontWeight: 700 }}>
          Masukkan PIN
        </h2>
        <p style={{ margin: "0 0 2rem 0", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
          Aplikasi ini dilindungi oleh PIN
        </p>

        {/* PIN Indicators */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "3rem" }}>
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                background: inputPin.length > index 
                  ? "var(--color-primary)" 
                  : "var(--color-surface-offset)",
                border: `2px solid ${inputPin.length > index ? "var(--color-primary)" : "var(--color-border)"}`,
                transition: "all 0.2s",
                transform: error ? "translateX(0)" : "none",
                animation: error ? "shake 0.4s ease" : "none",
              }}
            />
          ))}
        </div>

        {/* Numpad */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1.5rem",
            maxWidth: "300px",
            width: "100%",
          }}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num.toString())}
              style={{
                background: "var(--color-surface-offset)",
                border: "none",
                borderRadius: "50%",
                width: "72px",
                height: "72px",
                fontSize: "1.5rem",
                fontWeight: 600,
                color: "var(--color-text)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                margin: "0 auto",
                transition: "background 0.2s",
              }}
            >
              {num}
            </button>
          ))}
          
          <button
            style={{
              background: "none",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--color-primary)",
            }}
          >
            <Fingerprint size={32} />
          </button>
          
          <button
            onClick={() => handleKeyPress("0")}
            style={{
              background: "var(--color-surface-offset)",
              border: "none",
              borderRadius: "50%",
              width: "72px",
              height: "72px",
              fontSize: "1.5rem",
              fontWeight: 600,
              color: "var(--color-text)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              margin: "0 auto",
              transition: "background 0.2s",
            }}
          >
            0
          </button>

          <button
            onClick={handleDelete}
            style={{
              background: "none",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--color-text-muted)",
            }}
          >
            <Delete size={28} />
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          50% { transform: translateX(10px); }
          75% { transform: translateX(-10px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}
