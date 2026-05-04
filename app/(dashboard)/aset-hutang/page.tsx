"use client";
import React, { useEffect, useState } from "react";
import {
  deleteAsset,
  deleteDebt,
  getAssets,
  getDebts,
} from "@/app/actions/assets";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Pencil,
  Trash2,
  ArrowUpDown,
  ChevronDown,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { AssetForm } from "@/components/aset-hutang/AssetForm";
import { DebtForm } from "@/components/aset-hutang/DebtForm";
import { useAppStore } from "@/store/useAppStore";
import { Asset, Debt } from "@/types";
import toast from "react-hot-toast";

export default function AsetHutangPage() {
  const {
    assets,
    setAssets,
    debts,
    setDebts,
    isPrivateMode,
    togglePrivateMode,
  } = useAppStore();
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"aset" | "hutang">("aset");
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);

  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sortBy, setSortBy] = useState<"highest" | "lowest" | "newest">(
    "newest",
  );
  const [isSortOpen, setIsSortOpen] = useState(false);
  const supabase = createClient();

  const fetchData = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    const [aRes, dRes] = await Promise.all([getAssets(), getDebts()]);
    if (aRes.success && aRes.data) setAssets(aRes.data);
    if (dRes.success && dRes.data) setDebts(dRes.data);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(assets.length === 0 && debts.length === 0);
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalAset = assets.reduce((s, a) => s + a.nilai, 0);
  const totalHutang = debts.reduce((s, d) => s + d.sisa_hutang, 0);
  const kekayaanBersih = totalAset - totalHutang;

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);

    let result;
    if (activeTab === "aset") {
      result = await deleteAsset(deletingId);
    } else {
      result = await deleteDebt(deletingId);
    }

    setIsDeleting(false);
    if (result.success) {
      toast.success(
        activeTab === "aset"
          ? "Aset berhasil dihapus"
          : "Hutang berhasil dihapus",
      );
      setDeletingId(null);
      fetchData();
      // Sync background
      window.dispatchEvent(new Event("focus"));
    } else {
      toast.error(result.error || "Gagal menghapus data");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          padding: "0.5rem 0",
        }}
      >
        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>
            Aset & Hutang
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            Pantau kekayaan bersihmu secara real-time
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Button
            onClick={async () => {
              const {
                data: { user },
              } = await supabase.auth.getUser();
              if (!user) {
                toast.error("Silakan login untuk menambah data");
                window.location.href = "/login";
                return;
              }
              if (activeTab === "aset") {
                setIsAssetModalOpen(true);
              } else {
                setIsDebtModalOpen(true);
              }
            }}
            style={{
              borderRadius: "12px",
              height: "40px",
              padding: "0 1.25rem",
              background: "var(--color-primary)",
              color: "white",
            }}
          >
            <Plus size={18} style={{ marginRight: "0.5rem" }} />
            Tambah {activeTab === "aset" ? "Aset" : "Hutang"}
          </Button>
        </div>
      </div>

      {/* Net Worth Summary */}
      <div
        className="card"
        style={{
          padding: "1.5rem",
          background: "var(--color-primary)",
          color: "white",
          border: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h3
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              opacity: 0.9,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Kekayaan Bersih (Net Worth)
          </h3>
          <button
            onClick={togglePrivateMode}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              color: "white",
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            title={isPrivateMode ? "Tampilkan Saldo" : "Sembunyikan Saldo"}
          >
            {isPrivateMode ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "2rem",
            fontWeight: 700,
            marginTop: "0.5rem",
          }}
        >
          {isPrivateMode ? "Rp ••••••" : formatCurrency(kekayaanBersih)}
        </div>
        <div
          style={{
            display: "flex",
            gap: "2rem",
            marginTop: "1.25rem",
            paddingTop: "1.25rem",
            borderTop: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <div>
            <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>Total Aset</div>
            <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
              {isPrivateMode ? "Rp ••••••" : formatCurrency(totalAset)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>
              Total Hutang
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
              {isPrivateMode ? "Rp ••••••" : formatCurrency(totalHutang)}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--color-divider)",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
          }}
        >
          <button
            onClick={() => setActiveTab("aset")}
            style={{
              padding: "0.75rem 1rem",
              background: "none",
              border: "none",
              borderBottom:
                activeTab === "aset"
                  ? "2px solid var(--color-primary)"
                  : "2px solid transparent",
              color:
                activeTab === "aset"
                  ? "var(--color-primary)"
                  : "var(--color-text-muted)",
              fontWeight: activeTab === "aset" ? 600 : 500,
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Daftar Aset
          </button>
          <button
            onClick={() => setActiveTab("hutang")}
            style={{
              padding: "0.75rem 1rem",
              background: "none",
              border: "none",
              borderBottom:
                activeTab === "hutang"
                  ? "2px solid var(--color-primary)"
                  : "2px solid transparent",
              color:
                activeTab === "hutang"
                  ? "var(--color-primary)"
                  : "var(--color-text-muted)",
              fontWeight: activeTab === "hutang" ? 600 : 500,
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Daftar Hutang
          </button>
        </div>

        {/* Custom Premium Dropdown */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setIsSortOpen(!isSortOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 0.75rem",
              borderRadius: "12px",
              background: "var(--color-surface-offset)",
              border: "1px solid var(--color-border)",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--color-text-muted)",
              cursor: "pointer",
              transition: "all var(--transition)",
            }}
          >
            <ArrowUpDown size={14} />
            <span style={{ color: "var(--color-text)", fontWeight: 700 }}>
              {sortBy === "newest" && "Terbaru"}
              {sortBy === "highest" && "Tertinggi"}
              {sortBy === "lowest" && "Terendah"}
            </span>
            <ChevronDown
              size={14}
              style={{
                transform: isSortOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.3s ease",
              }}
            />
          </button>

          {isSortOpen && (
            <>
              <div
                onClick={() => setIsSortOpen(false)}
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 100,
                }}
              />
              <div
                className="card"
                style={{
                  position: "absolute",
                  top: "calc(100% + 0.5rem)",
                  right: 0,
                  minWidth: "180px",
                  zIndex: 101,
                  padding: "0.5rem",
                  boxShadow:
                    "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "16px",
                  background: "var(--color-surface)",
                  animation: "fadeIn 0.2s ease-out",
                }}
              >
                {[
                  { value: "newest", label: "Terbaru", icon: "✨" },
                  { value: "highest", label: "Nominal Tertinggi", icon: "📈" },
                  { value: "lowest", label: "Nominal Terendah", icon: "📉" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value as typeof sortBy);
                      setIsSortOpen(false);
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.75rem 0.875rem",
                      borderRadius: "10px",
                      background:
                        sortBy === option.value
                          ? "var(--color-primary-highlight)"
                          : "transparent",
                      border: "none",
                      color:
                        sortBy === option.value
                          ? "var(--color-primary)"
                          : "var(--color-text)",
                      fontSize: "0.8125rem",
                      fontWeight: sortBy === option.value ? 700 : 500,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.625rem",
                      }}
                    >
                      <span style={{ fontSize: "1rem" }}>{option.icon}</span>
                      {option.label}
                    </div>
                    {sortBy === option.value && <Check size={14} />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <CardSkeleton />
      ) : activeTab === "aset" ? (
        <div>
          {assets.length === 0 ? (
            <EmptyState
              icon="🏢"
              title="Belum ada aset"
              description="Catat aset pertamamu (Rumah, Kendaraan, Investasi)"
            />
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {[...assets]
                .sort((a, b) => {
                  if (sortBy === "highest") return b.nilai - a.nilai;
                  if (sortBy === "lowest") return a.nilai - b.nilai;
                  return 0;
                })
                .map((a) => (
                  <div
                    key={a.id}
                    className="card"
                    style={{
                      padding: "1rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "none",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.875rem",
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          fontSize: "1.25rem",
                          width: "40px",
                          height: "40px",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "var(--color-surface-offset)",
                          borderRadius: "12px",
                        }}
                      >
                        {a.jenis === "kas" && "💵"}
                        {a.jenis === "rekening" && "🏦"}
                        {a.jenis === "investasi" && "📈"}
                        {a.jenis === "emas" && "🟡"}
                        {a.jenis === "properti" && "🏠"}
                        {a.jenis === "kendaraan" && "🚗"}
                        {a.jenis === "lainnya" && "📦"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "1rem",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            color: "var(--color-text)",
                          }}
                        >
                          {a.nama}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            marginTop: "0.125rem",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "0.875rem",
                              fontWeight: 700,
                              color: "var(--color-income)",
                            }}
                          >
                            {isPrivateMode
                              ? "Rp ••••••"
                              : formatCurrency(a.nilai)}
                          </span>
                          <span
                            style={{
                              fontSize: "0.6875rem",
                              color: "var(--color-text-faint)",
                            }}
                          >
                            • {formatDate(a.tanggal_update)}
                          </span>
                        </div>
                        {a.catatan && (
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--color-text-muted)",
                              marginTop: "0.125rem",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {a.catatan}
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0rem",
                        flexShrink: 0,
                      }}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingAsset(a)}
                        style={{
                          color: "var(--color-text-faint)",
                          width: 28,
                          height: 28,
                        }}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingId(a.id)}
                        style={{
                          color: "var(--color-expense)",
                          opacity: 0.7,
                          width: 28,
                          height: 28,
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          {debts.length === 0 ? (
            <EmptyState
              icon="💳"
              title="Belum ada hutang"
              description="Wah bagus! Belum ada tanggungan hutang yang dicatat."
            />
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {[...debts]
                .sort((a, b) => {
                  if (sortBy === "highest")
                    return b.sisa_hutang - a.sisa_hutang;
                  if (sortBy === "lowest") return a.sisa_hutang - b.sisa_hutang;
                  return 0;
                })
                .map((d) => (
                  <div
                    key={d.id}
                    className="card"
                    style={{
                      padding: "1rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "none",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.875rem",
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          fontSize: "1.25rem",
                          width: "40px",
                          height: "40px",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "var(--color-surface-offset)",
                          borderRadius: "12px",
                        }}
                      >
                        💳
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "1rem",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            color: "var(--color-text)",
                          }}
                        >
                          {d.nama_hutang}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            marginTop: "0.125rem",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "0.875rem",
                              fontWeight: 700,
                              color: "var(--color-expense)",
                            }}
                          >
                            {isPrivateMode
                              ? "Rp ••••••"
                              : formatCurrency(d.sisa_hutang)}
                          </span>
                          <span
                            style={{
                              fontSize: "0.6875rem",
                              color: "var(--color-text-faint)",
                            }}
                          >
                            • s.d {formatDate(d.tanggal_jatuh_tempo)}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--color-text-muted)",
                            marginTop: "0.125rem",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {d.catatan ? `${d.catatan} • ` : ""}Cicilan:{" "}
                          {isPrivateMode
                            ? "Rp ••••••"
                            : `${formatCurrency(d.cicilan_bulanan)}/bln`}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0rem",
                        flexShrink: 0,
                      }}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingDebt(d)}
                        style={{
                          color: "var(--color-text-faint)",
                          width: 28,
                          height: 28,
                        }}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingId(d.id)}
                        style={{
                          color: "var(--color-expense)",
                          opacity: 0.7,
                          width: 28,
                          height: 28,
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <Modal
        isOpen={isAssetModalOpen || !!editingAsset}
        onClose={() => {
          setIsAssetModalOpen(false);
          setEditingAsset(null);
        }}
        title={editingAsset ? "Edit Aset" : "Tambah Aset Baru"}
        size="md"
      >
        <AssetForm
          initialData={editingAsset || undefined}
          onSuccess={() => {
            setIsAssetModalOpen(false);
            setEditingAsset(null);
            fetchData();
          }}
        />
      </Modal>

      <Modal
        isOpen={isDebtModalOpen || !!editingDebt}
        onClose={() => {
          setIsDebtModalOpen(false);
          setEditingDebt(null);
        }}
        title={editingDebt ? "Edit Data Hutang" : "Catat Hutang/Pinjaman"}
        size="md"
      >
        <DebtForm
          initialData={editingDebt || undefined}
          onSuccess={() => {
            setIsDebtModalOpen(false);
            setEditingDebt(null);
            fetchData();
          }}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        title={activeTab === "aset" ? "Hapus Aset" : "Hapus Data Hutang"}
        size="sm"
        footer={
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
              width: "100%",
            }}
          >
            <Button
              variant="secondary"
              onClick={() => setDeletingId(null)}
              fullWidth
            >
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={isDeleting}
              fullWidth
            >
              Ya, Hapus
            </Button>
          </div>
        }
      >
        <div style={{ textAlign: "center", padding: "1rem 0" }}>
          <p style={{ color: "var(--color-text)", fontWeight: 500 }}>
            Apakah Anda yakin ingin menghapus data ini?
          </p>
          <p
            style={{
              fontSize: "0.8125rem",
              color: "var(--color-text-muted)",
              marginTop: "0.5rem",
            }}
          >
            Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>
      </Modal>
    </div>
  );
}
