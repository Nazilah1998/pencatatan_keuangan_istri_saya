"use client";
import React, { useState } from "react";
import {
  deleteAsset,
  deleteDebt,
  getAssets,
  getDebts,
} from "@/app/actions/assets";
import { Plus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { AssetForm } from "@/components/aset-hutang/AssetForm";
import { DebtForm } from "@/components/aset-hutang/DebtForm";
import { useAppStore } from "@/store/useAppStore";
import { Asset, Debt } from "@/types";
import toast from "react-hot-toast";
import { useTranslation } from "@/lib/i18n/useTranslation";

// Sub-components
import { SummaryCard } from "@/components/aset-hutang/sections/SummaryCard";
import { AssetList } from "@/components/aset-hutang/sections/AssetList";
import { DebtList } from "@/components/aset-hutang/sections/DebtList";
import { SortDropdown } from "@/components/aset-hutang/sections/SortDropdown";

interface AsetHutangClientProps {
  initialAssets: Asset[];
  initialDebts: Debt[];
}

export function AsetHutangClient({
  initialAssets,
  initialDebts,
}: AsetHutangClientProps) {
  const { t } = useTranslation();
  const { isPrivateMode, togglePrivateMode } = useAppStore();
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [debts, setDebts] = useState<Debt[]>(initialDebts);
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

  const refreshData = async () => {
    const [aRes, dRes] = await Promise.all([getAssets(), getDebts()]);
    if (aRes.success && aRes.data) setAssets(aRes.data);
    if (dRes.success && dRes.data) setDebts(dRes.data);
  };

  const totalAset = assets.reduce((s, a) => s + a.nilai, 0);
  const totalHutang = debts.reduce((s, d) => s + d.sisa_hutang, 0);
  const kekayaanBersih = totalAset - totalHutang;

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    const result =
      activeTab === "aset"
        ? await deleteAsset(deletingId)
        : await deleteDebt(deletingId);
    setIsDeleting(false);

    if (result.success) {
      toast.success(t("common.success"));
      setDeletingId(null);
      refreshData();
    } else {
      toast.error(result.error || t("common.error"));
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
            {t("assets.title")}
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            {t("assets.subtitle")}
          </p>
        </div>
        <Button
          onClick={() =>
            activeTab === "aset"
              ? setIsAssetModalOpen(true)
              : setIsDebtModalOpen(true)
          }
          style={{ borderRadius: "12px", height: "40px", padding: "0 1.25rem" }}
        >
          <Plus size={18} style={{ marginRight: "0.5rem" }} />
          {t("common.add")}{" "}
          {activeTab === "aset"
            ? t("sidebar.assets").split(" ")[0]
            : t("sidebar.assets").split("&")[1]?.trim() || t("sidebar.assets")}
        </Button>
      </div>

      <SummaryCard
        totalAset={totalAset}
        totalHutang={totalHutang}
        kekayaanBersih={kekayaanBersih}
        isPrivateMode={isPrivateMode}
        togglePrivateMode={togglePrivateMode}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--color-divider)",
        }}
      >
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {["aset", "hutang"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as "aset" | "hutang")}
              style={{
                padding: "0.75rem 1rem",
                background: "none",
                border: "none",
                borderBottom:
                  activeTab === tab
                    ? "2px solid var(--color-primary)"
                    : "2px solid transparent",
                color:
                  activeTab === tab
                    ? "var(--color-primary)"
                    : "var(--color-text-muted)",
                fontWeight: activeTab === tab ? 600 : 500,
                cursor: "pointer",
                fontSize: "0.875rem",
                textTransform: "capitalize",
              }}
            >
              {tab === "aset" ? t("assets.tab_assets") : t("assets.tab_debts")}
            </button>
          ))}
        </div>
        <SortDropdown
          sortBy={sortBy}
          setSortBy={setSortBy}
          isOpen={isSortOpen}
          setIsOpen={setIsSortOpen}
        />
      </div>

      {activeTab === "aset" ? (
        <AssetList
          assets={assets}
          sortBy={sortBy}
          isPrivateMode={isPrivateMode}
          onEdit={setEditingAsset}
          onDelete={setDeletingId}
        />
      ) : (
        <DebtList
          debts={debts}
          sortBy={sortBy}
          isPrivateMode={isPrivateMode}
          onEdit={setEditingDebt}
          onDelete={setDeletingId}
        />
      )}

      {/* Modals */}
      <Modal
        isOpen={isAssetModalOpen || !!editingAsset}
        onClose={() => {
          setIsAssetModalOpen(false);
          setEditingAsset(null);
        }}
        title={editingAsset ? t("common.edit") : t("assets.add_asset")}
      >
        <AssetForm
          initialData={editingAsset || undefined}
          onSuccess={() => {
            setIsAssetModalOpen(false);
            setEditingAsset(null);
            refreshData();
          }}
        />
      </Modal>

      <Modal
        isOpen={isDebtModalOpen || !!editingDebt}
        onClose={() => {
          setIsDebtModalOpen(false);
          setEditingDebt(null);
        }}
        title={editingDebt ? t("common.edit") : t("assets.add_debt")}
      >
        <DebtForm
          initialData={editingDebt || undefined}
          onSuccess={() => {
            setIsDebtModalOpen(false);
            setEditingDebt(null);
            refreshData();
          }}
        />
      </Modal>

      <Modal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        title={t("common.delete")}
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
              {t("common.cancel")}
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={isDeleting}
              fullWidth
            >
              {t("common.delete")}
            </Button>
          </div>
        }
      >
        <div style={{ textAlign: "center", padding: "1rem 0" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "var(--color-expense-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-expense)",
              margin: "0 auto 1rem",
            }}
          >
            <AlertTriangle size={28} />
          </div>
          <h3
            style={{
              fontSize: "1.125rem",
              fontWeight: 700,
              marginBottom: "0.5rem",
            }}
          >
            {t("common.delete")}?
          </h3>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            {t("common.delete_confirm_desc")}
          </p>
        </div>
      </Modal>
    </div>
  );
}
