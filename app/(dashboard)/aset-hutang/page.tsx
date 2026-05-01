"use client";
import React, { useEffect, useState } from "react";
import { getAssets, getDebts } from "@/app/actions/assets";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Asset, Debt } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { AssetForm } from "@/components/aset-hutang/AssetForm";
import { DebtForm } from "@/components/aset-hutang/DebtForm";

export default function AsetHutangPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"aset" | "hutang">("aset");
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [aRes, dRes] = await Promise.all([getAssets(), getDebts()]);
    if (aRes.success && aRes.data) setAssets(aRes.data);
    if (dRes.success && dRes.data) setDebts(dRes.data);
    setLoading(false);
  };

  useEffect(() => {
    Promise.resolve().then(() => fetchData());
  }, []);

  const totalAset = assets.reduce((s, a) => s + a.nilai, 0);
  const totalHutang = debts.reduce((s, d) => s + d.sisa_hutang, 0);
  const kekayaanBersih = totalAset - totalHutang;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "1rem",
          padding: "0.5rem 0",
          borderBottom: "1px solid var(--color-border-subtle)",
          marginBottom: "0.5rem",
          position: "relative",
          zIndex: 50,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--color-text)",
              letterSpacing: "-0.025em",
              margin: 0,
            }}
          >
            Aset & Hutang
          </h2>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-muted)",
              marginTop: "0.25rem",
            }}
          >
            Pantau kekayaan bersihmu
          </p>
        </div>

        {activeTab === "aset" ? (
          <Button
            onClick={() => setIsAssetModalOpen(true)}
            size="sm"
            style={{ borderRadius: "12px" }}
          >
            <Plus size={16} style={{ marginRight: "0.5rem" }} /> Tambah Aset
          </Button>
        ) : (
          <Button
            onClick={() => setIsDebtModalOpen(true)}
            size="sm"
            variant="danger"
            style={{ borderRadius: "12px" }}
          >
            <Plus size={16} style={{ marginRight: "0.5rem" }} /> Tambah Hutang
          </Button>
        )}
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
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "2rem",
            fontWeight: 700,
            marginTop: "0.5rem",
          }}
        >
          {formatCurrency(kekayaanBersih)}
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
              {formatCurrency(totalAset)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>
              Total Hutang
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
              {formatCurrency(totalHutang)}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          borderBottom: "1px solid var(--color-divider)",
        }}
      >
        <button
          onClick={() => setActiveTab("aset")}
          style={{
            padding: "0.75rem 1.5rem",
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
          }}
        >
          Daftar Aset
        </button>
        <button
          onClick={() => setActiveTab("hutang")}
          style={{
            padding: "0.75rem 1.5rem",
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
          }}
        >
          Daftar Hutang
        </button>
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
            <div className="card">
              {assets.map((a) => (
                <div
                  key={a.id}
                  style={{
                    padding: "1rem",
                    borderBottom: "1px solid var(--color-divider)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{a.nama}</div>
                    <div
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {a.jenis} • {a.institusi || "-"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontWeight: 600,
                        color: "var(--color-income)",
                      }}
                    >
                      {formatCurrency(a.nilai)}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      Update: {formatDate(a.tanggal_update)}
                    </div>
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
            <div className="card">
              {debts.map((d) => (
                <div
                  key={d.id}
                  style={{
                    padding: "1rem",
                    borderBottom: "1px solid var(--color-divider)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{d.nama_hutang}</div>
                    <div
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {d.jenis} • Sisa tenor s.d{" "}
                      {formatDate(d.tanggal_jatuh_tempo)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontWeight: 600,
                        color: "var(--color-expense)",
                      }}
                    >
                      {formatCurrency(d.sisa_hutang)}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      Cicilan: {formatCurrency(d.cicilan_bulanan)}/bln
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <Modal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        title="Tambah Aset Baru"
        size="md"
      >
        <AssetForm
          onSuccess={() => {
            setIsAssetModalOpen(false);
            fetchData();
          }}
        />
      </Modal>

      <Modal
        isOpen={isDebtModalOpen}
        onClose={() => setIsDebtModalOpen(false)}
        title="Catat Hutang/Pinjaman"
        size="md"
      >
        <DebtForm
          onSuccess={() => {
            setIsDebtModalOpen(false);
            fetchData();
          }}
        />
      </Modal>
    </div>
  );
}
