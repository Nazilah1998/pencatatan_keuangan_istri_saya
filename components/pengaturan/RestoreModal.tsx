"use client";

import React, { useState, useRef, useCallback } from "react";
import { UploadCloud, FileJson, X, AlertCircle } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface RestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RestoreModal({ isOpen, onClose }: RestoreModalProps) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateAndSetFile = (selectedFile: File) => {
    setErrorMsg(null);
    if (!selectedFile.name.endsWith(".json")) {
      setErrorMsg("Format file harus berupa .json");
      setFile(null);
      return;
    }
    setFile(selectedFile);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleClearFile = () => {
    setFile(null);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRestore = async () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (
          !data ||
          (!data.transactions && !data.budgets && !data.savings && !data.assets && !data.debts)
        ) {
          throw new Error("Format file cadangan tidak valid atau rusak.");
        }

        setIsRestoring(true);
        const loadingToast = toast.loading("Memulihkan data ke sistem...");

        const state = useAppStore.getState();
        const userId = state.user?.id;

        if (userId) {
          const { restoreBackupData } = await import("@/app/actions/backup");
          const result = await restoreBackupData(data);
          
          if (!result.success) {
            toast.error(result.error || "Gagal memulihkan data ke sistem cloud", { id: loadingToast });
            setIsRestoring(false);
            return;
          }
        }

        // Update local state after successful cloud restore
        state.setAllData({
          transactions: data.transactions || [],
          budgets: data.budgets || [],
          savings: data.savings || [],
          assets: data.assets || [],
          debts: data.debts || [],
        });

        if (data.settings) {
          state.setSettings(data.settings);
        }

        toast.success(
          t("settings.backup_import_success") || "Data berhasil dipulihkan secara permanen!",
          { id: loadingToast }
        );

        handleClearFile();
        onClose();
      } catch (err: unknown) {
        console.error("Gagal memulihkan data:", err);
        setErrorMsg(err instanceof Error ? err.message : "Gagal mengimpor file. Format tidak dikenal.");
        toast.error("Proses pemulihan gagal.");
      } finally {
        setIsRestoring(false);
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
        padding: "1rem",
      }}
    >
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "20px",
          padding: "2rem",
          maxWidth: "480px",
          width: "100%",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          position: "relative",
          animation: "fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <button
          onClick={() => {
            if (!isRestoring) {
              handleClearFile();
              onClose();
            }
          }}
          disabled={isRestoring}
          style={{
            position: "absolute",
            top: "1.25rem",
            right: "1.25rem",
            background: "none",
            border: "none",
            color: "var(--color-text-muted)",
            cursor: isRestoring ? "not-allowed" : "pointer",
            opacity: isRestoring ? 0.4 : 1,
            padding: "0.25rem",
          }}
        >
          <X size={20} />
        </button>

        <h3
          style={{
            fontSize: "1.25rem",
            fontWeight: 800,
            color: "var(--color-text)",
            margin: "0 0 0.5rem 0",
          }}
        >
          Pulihkan Data
        </h3>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--color-text-muted)",
            lineHeight: "1.5",
            margin: "0 0 1.5rem 0",
          }}
        >
          Unggah file cadangan JSON Anda ke area di bawah ini untuk memulihkan transaksi dan pengaturan Anda.
        </p>

        {!file ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? "var(--color-primary)" : "var(--color-border)"}`,
              borderRadius: "16px",
              background: isDragging ? "var(--color-surface-offset)" : "transparent",
              padding: "2.5rem 1.5rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
              marginBottom: "1.5rem",
            }}
          >
            <UploadCloud
              size={48}
              color={isDragging ? "var(--color-primary)" : "var(--color-text-faint)"}
              style={{ marginBottom: "1rem", transition: "color 0.2s" }}
            />
            <p
              style={{
                fontSize: "0.9375rem",
                fontWeight: 600,
                color: isDragging ? "var(--color-primary)" : "var(--color-text)",
                margin: "0 0 0.25rem 0",
                textAlign: "center",
              }}
            >
              Tarik & Lepas file JSON ke sini
            </p>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--color-text-muted)",
                margin: 0,
                textAlign: "center",
              }}
            >
              atau klik untuk mencari dari perangkat
            </p>
          </div>
        ) : (
          <div
            style={{
              border: "1px solid var(--color-border)",
              borderRadius: "12px",
              padding: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              marginBottom: "1.5rem",
              background: "var(--color-surface-offset)",
            }}
          >
            <div
              style={{
                background: "rgba(99, 102, 241, 0.1)",
                color: "#6366f1",
                padding: "0.75rem",
                borderRadius: "10px",
              }}
            >
              <FileJson size={24} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--color-text)",
                  margin: "0 0 0.125rem 0",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {file.name}
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0 }}>
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            {!isRestoring && (
              <button
                onClick={handleClearFile}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--color-text-muted)",
                  cursor: "pointer",
                  padding: "0.5rem",
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        {errorMsg && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1rem",
              background: "#fef2f2",
              color: "#dc2626",
              borderRadius: "8px",
              fontSize: "0.8125rem",
              fontWeight: 500,
              marginBottom: "1.5rem",
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            {errorMsg}
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          accept=".json"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              handleClearFile();
              onClose();
            }}
            disabled={isRestoring}
          >
            Batal
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={handleRestore}
            disabled={!file || isRestoring}
          >
            {isRestoring ? "Memulihkan..." : "Pulihkan Sekarang"}
          </Button>
        </div>
      </div>
    </div>
  );
}
