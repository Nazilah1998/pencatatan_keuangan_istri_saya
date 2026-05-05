"use client";
import React, { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/Button";
import { Plus, Trash2, ArrowLeft, ChevronRight, X, Check } from "lucide-react";
import toast from "react-hot-toast";
import { CATEGORY_PRESETS } from "@/lib/constants";
import { AppSettings } from "@/types";
import { updateProfile } from "@/app/actions/profiles";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface KategoriClientProps {
  initialSettings: Partial<AppSettings>;
}

export function KategoriClient({}: KategoriClientProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { settings: storeSettings, setSettings: setStoreSettings } =
    useAppStore();

  const settings = storeSettings;
  const custom_categories = settings.custom_categories || [];

  const [activeTab, setActiveTab] = useState<"pengeluaran" | "pemasukan">(
    "pengeluaran",
  );

  // States for adding new category
  const [isManual, setIsManual] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("📁");
  const [selectedCatForSub, setSelectedCatForSub] = useState<string | null>(
    null,
  );

  // States for sub-category
  const [newSubName, setNewSubName] = useState("");
  const [newSubIcon, setNewSubIcon] = useState("🔹");
  const [showSubIconPicker, setShowSubIconPicker] = useState(false);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);

  const subInputRef = React.useRef<HTMLInputElement>(null);

  const syncSettings = async (newSettings: Partial<AppSettings>) => {
    setStoreSettings(newSettings);
    await updateProfile(newSettings);
  };

  const handleAddCategory = (name: string, icon: string) => {
    if (
      custom_categories.some(
        (c) =>
          c.name.toLowerCase() === name.toLowerCase() && c.type === activeTab,
      )
    ) {
      toast.error(t("settings.category.error_exists"));
      return;
    }
    const newCat = {
      id: crypto.randomUUID(),
      name: name.trim(),
      icon: icon,
      type: activeTab,
      color: activeTab === "pengeluaran" ? "#ef4444" : "#10b981",
      sub_categories: [],
    };
    const updated = {
      ...settings,
      custom_categories: [...custom_categories, newCat],
    };
    syncSettings(updated);
    setNewCategoryName("");
    setIsManual(false);
    toast.success(`${name} ${t("settings.category.success_added")}`);
  };

  const handleDeleteCategory = (id: string) => {
    const updated = {
      ...settings,
      custom_categories: custom_categories.filter((c) => c.id !== id),
    };
    syncSettings(updated);
    toast.success(t("settings.category.success_deleted"));
  };

  const handleSaveSub = (catId: string) => {
    if (!newSubName.trim()) return;
    let updatedCats;
    if (editingSubId) {
      updatedCats = custom_categories.map((c) =>
        c.id === catId
          ? {
              ...c,
              sub_categories: c.sub_categories.map((s) =>
                s.id === editingSubId
                  ? { ...s, name: newSubName.trim(), icon: newSubIcon }
                  : s,
              ),
            }
          : c,
      );
    } else {
      updatedCats = custom_categories.map((c) =>
        c.id === catId
          ? {
              ...c,
              sub_categories: [
                ...c.sub_categories,
                {
                  id: crypto.randomUUID(),
                  name: newSubName.trim(),
                  icon: newSubIcon,
                },
              ],
            }
          : c,
      );
    }
    syncSettings({ ...settings, custom_categories: updatedCats });
    setNewSubName("");
    setNewSubIcon("🔹");
    setEditingSubId(null);
    setShowSubIconPicker(false);
    toast.success(
      editingSubId
        ? t("settings.category.sub_success_updated")
        : t("settings.category.sub_success_added"),
    );
  };

  const handleDeleteSub = (catId: string, subId: string) => {
    const updatedCats = custom_categories.map((c) =>
      c.id === catId
        ? {
            ...c,
            sub_categories: c.sub_categories.filter((s) => s.id !== subId),
          }
        : c,
    );
    syncSettings({ ...settings, custom_categories: updatedCats });
    toast.success(t("settings.category.sub_success_deleted"));
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", paddingBottom: "3rem" }}>
      <button
        onClick={() => router.back()}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          background: "none",
          border: "none",
          color: "var(--color-primary)",
          fontWeight: 600,
          cursor: "pointer",
          marginBottom: "1rem",
        }}
      >
        <ArrowLeft size={18} /> {t("common.back")}
      </button>

      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>
          {t("settings.category.title")}
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
          {t("settings.category.subtitle")}
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1.5rem",
          background: "var(--color-surface-offset)",
          padding: "0.375rem",
          borderRadius: "12px",
        }}
      >
        <button
          onClick={() => {
            setActiveTab("pengeluaran");
            setIsManual(false);
          }}
          style={{
            flex: 1,
            padding: "0.75rem",
            border: "none",
            borderRadius: "8px",
            fontWeight: 700,
            fontSize: "0.8125rem",
            cursor: "pointer",
            background:
              activeTab === "pengeluaran"
                ? "var(--color-expense)"
                : "transparent",
            color:
              activeTab === "pengeluaran" ? "white" : "var(--color-text-muted)",
            transition: "all 0.2s",
          }}
        >
          📉 {t("settings.category.expense")}
        </button>
        <button
          onClick={() => {
            setActiveTab("pemasukan");
            setIsManual(false);
          }}
          style={{
            flex: 1,
            padding: "0.75rem",
            border: "none",
            borderRadius: "8px",
            fontWeight: 700,
            fontSize: "0.8125rem",
            cursor: "pointer",
            background:
              activeTab === "pemasukan" ? "var(--color-income)" : "transparent",
            color:
              activeTab === "pemasukan" ? "white" : "var(--color-text-muted)",
            transition: "all 0.2s",
          }}
        >
          📈 {t("settings.category.income")}
        </button>
      </div>

      {/* Add Section */}
      <div
        className="card"
        style={{ padding: "1.5rem", marginBottom: "1.5rem" }}
      >
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>
          {t("settings.category.add_title")}{" "}
          {activeTab === "pengeluaran"
            ? t("settings.category.expense")
            : t("settings.category.income")}
        </h3>
        {!isManual ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
              gap: "0.75rem",
            }}
          >
            {CATEGORY_PRESETS[activeTab].map((p) => (
              <button
                key={p.name}
                onClick={() => handleAddCategory(p.name, p.icon)}
                style={{
                  padding: "0.75rem",
                  borderRadius: "12px",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface-offset)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                }}
              >
                <span>{p.icon}</span>
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.name}
                </span>
              </button>
            ))}
            <button
              onClick={() => setIsManual(true)}
              style={{
                padding: "0.75rem",
                borderRadius: "12px",
                border: "1px dashed var(--color-primary)",
                background: "var(--color-primary-highlight)",
                color: "var(--color-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                cursor: "pointer",
                fontSize: "0.8125rem",
                fontWeight: 700,
              }}
            >
              <Plus size={16} /> {t("settings.category.others")}
            </button>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <input
                type="text"
                className="input"
                placeholder={t("settings.category.custom_placeholder")}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                autoFocus
              />
              <input
                type="text"
                className="input"
                style={{ width: "60px", textAlign: "center" }}
                value={newCategoryIcon}
                onChange={(e) => setNewCategoryIcon(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Button
                variant="primary"
                style={{ flex: 1 }}
                onClick={() =>
                  handleAddCategory(newCategoryName, newCategoryIcon)
                }
              >
                {t("settings.category.save")}
              </Button>
              <Button variant="ghost" onClick={() => setIsManual(false)}>
                {t("settings.category.cancel")}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* List Section */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {custom_categories
          .filter((c) => c.type === activeTab)
          .map((cat) => (
            <div
              key={cat.id}
              className="card"
              style={{
                padding: "0.5rem",
                border: "1px solid var(--color-border)",
              }}
            >
              <div
                style={{
                  padding: "0.75rem 1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    cursor: "pointer",
                    flex: 1,
                  }}
                  onClick={() =>
                    setSelectedCatForSub(
                      selectedCatForSub === cat.id ? null : cat.id,
                    )
                  }
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: "var(--color-surface-offset)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.25rem",
                    }}
                  >
                    {cat.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
                      {cat.name}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {cat.sub_categories.length}{" "}
                      {t("settings.category.sub_cat")}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    style={{
                      color: "#ef4444",
                      background: "rgba(239, 68, 68, 0.1)",
                      border: "none",
                      padding: "0.5rem",
                      borderRadius: "8px",
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                  <button
                    onClick={() =>
                      setSelectedCatForSub(
                        selectedCatForSub === cat.id ? null : cat.id,
                      )
                    }
                    style={{
                      color: "var(--color-primary)",
                      background: "var(--color-primary-highlight)",
                      border: "none",
                      padding: "0.5rem",
                      borderRadius: "8px",
                      cursor: "pointer",
                      transform:
                        selectedCatForSub === cat.id
                          ? "rotate(90deg)"
                          : "rotate(0deg)",
                      transition: "transform 0.2s",
                    }}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              {selectedCatForSub === cat.id && (
                <div
                  style={{
                    padding: "1rem",
                    borderTop: "1px solid var(--color-border)",
                    background: "var(--color-surface-offset)",
                    borderRadius: "0 0 12px 12px",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <button
                      onClick={() => setShowSubIconPicker(!showSubIconPicker)}
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "8px",
                        border: "1px solid var(--color-border)",
                        background: "white",
                        fontSize: "1.25rem",
                        cursor: "pointer",
                      }}
                    >
                      {newSubIcon}
                    </button>
                    <input
                      ref={subInputRef}
                      type="text"
                      className="input"
                      placeholder={
                        editingSubId
                          ? t("settings.category.sub_edit_placeholder")
                          : t("settings.category.sub_placeholder")
                      }
                      value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                      style={{ background: "white", flex: 1 }}
                    />
                    <Button size="sm" onClick={() => handleSaveSub(cat.id)}>
                      {editingSubId ? <Check size={16} /> : <Plus size={16} />}
                    </Button>
                  </div>
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}
                  >
                    {cat.sub_categories.map((sub) => (
                      <div
                        key={sub.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          padding: "0.375rem 0.75rem",
                          background: "white",
                          borderRadius: "20px",
                          border: "1px solid var(--color-border)",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        }}
                      >
                        <span>{sub.icon || "🔹"}</span>
                        <span>{sub.name}</span>
                        <div
                          onClick={() => handleDeleteSub(cat.id, sub.id)}
                          style={{
                            marginLeft: "0.25rem",
                            color: "#ef4444",
                            cursor: "pointer",
                          }}
                        >
                          <X size={14} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
