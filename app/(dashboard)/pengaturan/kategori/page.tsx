"use client";
import React, { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/Button";
import { Plus, Trash2, ArrowLeft, ChevronRight, X, Check } from "lucide-react";
import toast from "react-hot-toast";
import { ICON_CATEGORIES } from "@/lib/icons";
import { CATEGORY_PRESETS } from "@/lib/presets";

export default function KategoriManagementPage() {
  const { settings, setSettings } = useAppStore();
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

  const handleAddCategory = (name: string, icon: string) => {
    if (
      custom_categories.some(
        (c) =>
          c.name.toLowerCase() === name.toLowerCase() && c.type === activeTab,
      )
    ) {
      toast.error("Kategori sudah ada!");
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
    setSettings({
      custom_categories: [...custom_categories, newCat],
    });
    setNewCategoryName("");
    setIsManual(false);
    toast.success(`${name} ditambahkan!`);
  };

  const handleDeleteCategory = (id: string) => {
    setSettings({
      custom_categories: custom_categories.filter((c) => c.id !== id),
    });
    toast.success("Kategori dihapus");
  };

  const handleSaveSub = (catId: string) => {
    if (!newSubName.trim()) return;

    if (editingSubId) {
      // Logic Update
      const updated = custom_categories.map((c) => {
        if (c.id === catId) {
          return {
            ...c,
            sub_categories: c.sub_categories.map((s) =>
              s.id === editingSubId
                ? { ...s, name: newSubName.trim(), icon: newSubIcon }
                : s,
            ),
          };
        }
        return c;
      });
      setSettings({ custom_categories: updated });
      toast.success("Sub-kategori diperbarui");
    } else {
      // Logic Add
      const updated = custom_categories.map((c) => {
        if (c.id === catId) {
          return {
            ...c,
            sub_categories: [
              ...c.sub_categories,
              {
                id: crypto.randomUUID(),
                name: newSubName.trim(),
                icon: newSubIcon,
              },
            ],
          };
        }
        return c;
      });
      setSettings({ custom_categories: updated });
      toast.success("Sub-kategori ditambahkan");
    }

    // Reset States
    setNewSubName("");
    setNewSubIcon("🔹");
    setEditingSubId(null);
    setShowSubIconPicker(false);
  };

  const subInputRef = React.useRef<HTMLInputElement>(null);

  const startEditSub = (sub: { id: string; name: string; icon: string }) => {
    setNewSubName(sub.name);
    setNewSubIcon(sub.icon || "🔹");
    setEditingSubId(sub.id);

    // Beri sedikit delay agar React sempat me-render state sebelum fokus
    setTimeout(() => {
      subInputRef.current?.focus();
    }, 100);
  };

  const handleDeleteSub = (catId: string, subId: string) => {
    const updated = custom_categories.map((c) => {
      if (c.id === catId) {
        return {
          ...c,
          sub_categories: c.sub_categories.filter((s) => s.id !== subId),
        };
      }
      return c;
    });
    setSettings({ custom_categories: updated });
    toast.success("Sub-kategori dihapus");
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", paddingBottom: "3rem" }}>
      <button
        onClick={() => (window.location.href = "/transaksi")}
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
        <ArrowLeft size={18} /> Kembali
      </button>

      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Atur Kategori</h2>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
          Kelola kategori dan sub-kategori transaksi Anda
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
          📉 Pengeluaran
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
          📈 Pemasukan
        </button>
      </div>

      {/* Add Section */}
      <div
        className="card"
        style={{ padding: "1.5rem", marginBottom: "1.5rem" }}
      >
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>
          Tambah Kategori{" "}
          {activeTab === "pengeluaran" ? "Pengeluaran" : "Pemasukan"}
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
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "var(--color-primary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "var(--color-border)")
                }
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
              <Plus size={16} /> Lainnya
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
                placeholder="Nama kategori kustom..."
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
                Simpan Kategori
              </Button>
              <Button
                variant="ghost"
                onClick={() => setIsManual(false)}
                style={{ border: "none" }}
              >
                Batal
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* List Section */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <h3
          style={{
            fontSize: "0.875rem",
            fontWeight: 700,
            color: "var(--color-text-muted)",
            marginBottom: "0.25rem",
          }}
        >
          Kategori Aktif (
          {custom_categories.filter((c) => c.type === activeTab).length})
        </h3>
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
                      {cat.sub_categories.length} Sub-kategori
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

              {/* Sub-categories Area */}
              {selectedCatForSub === cat.id && (
                <div
                  style={{
                    padding: "1rem",
                    borderTop: "1px solid var(--color-border)",
                    background: "var(--color-surface-offset)",
                    borderRadius: "0 0 12px 12px",
                    position: "relative", // Pindahkan ke sini agar picker bisa full width kartu
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <div>
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
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {newSubIcon}
                      </button>

                      <div
                        style={{
                          position: "absolute",
                          top: "60px",
                          left: "1rem",
                          right: "1rem",
                          zIndex: 100,
                          background: "white",
                          border: "1px solid var(--color-border)",
                          borderRadius: "12px",
                          padding: "1rem",
                          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                          maxHeight: "350px",
                          overflowY: "auto",
                          overflowX: "hidden",
                          display: showSubIconPicker ? "block" : "none",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "1rem",
                          }}
                        >
                          {ICON_CATEGORIES.map((cat) => (
                            <div key={cat.name}>
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  fontWeight: 800,
                                  color: "var(--color-text-muted)",
                                  marginBottom: "0.5rem",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.05em",
                                }}
                              >
                                {cat.name}
                              </div>
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns:
                                    "repeat(auto-fill, minmax(44px, 1fr))", // Otomatis menyesuaikan jumlah kolom
                                  gap: "0.5rem",
                                  padding: "0.25rem",
                                }}
                              >
                                {cat.icons.map((icon, idx) => (
                                  <button
                                    key={`${icon}-${idx}`}
                                    onClick={() => {
                                      setNewSubIcon(icon);
                                      setShowSubIconPicker(false);
                                    }}
                                    style={{
                                      aspectRatio: "1/1",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: "1.25rem",
                                      background:
                                        newSubIcon === icon
                                          ? "var(--color-primary-highlight)"
                                          : "none",
                                      border:
                                        newSubIcon === icon
                                          ? "2px solid var(--color-primary)"
                                          : "none",
                                      cursor: "pointer",
                                      borderRadius: "8px",
                                      transition: "all 0.2s",
                                    }}
                                    onMouseEnter={(e) => {
                                      if (newSubIcon !== icon) {
                                        e.currentTarget.style.background =
                                          "var(--color-surface-offset)";
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (newSubIcon !== icon) {
                                        e.currentTarget.style.background =
                                          "none";
                                      }
                                    }}
                                  >
                                    {icon}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <input
                      ref={subInputRef}
                      type="text"
                      className="input"
                      placeholder={
                        editingSubId ? "Edit nama..." : "Nama sub-kategori..."
                      }
                      value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                      style={{
                        background: "white",
                        flex: 1,
                        borderColor: editingSubId
                          ? "var(--color-primary)"
                          : "var(--color-border)",
                      }}
                    />
                    {editingSubId && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingSubId(null);
                          setNewSubName("");
                          setNewSubIcon("🔹");
                        }}
                        style={{ color: "#ef4444" }}
                      >
                        <X size={16} />
                      </Button>
                    )}
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
                        onClick={() => startEditSub(sub)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          padding: "0.375rem 0.75rem",
                          background:
                            editingSubId === sub.id
                              ? "var(--color-primary-highlight)"
                              : "white",
                          borderRadius: "20px",
                          border:
                            editingSubId === sub.id
                              ? "1px solid var(--color-primary)"
                              : "1px solid var(--color-border)",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        <span>{sub.icon || "🔹"}</span>
                        <span>{sub.name}</span>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSub(cat.id, sub.id);
                          }}
                          style={{
                            marginLeft: "0.25rem",
                            color: "#ef4444",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <X size={14} />
                        </div>
                      </div>
                    ))}
                    {cat.sub_categories.length === 0 && (
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--color-text-muted)",
                          fontStyle: "italic",
                        }}
                      >
                        Belum ada sub-kategori
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
