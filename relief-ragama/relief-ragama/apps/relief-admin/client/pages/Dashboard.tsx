import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Download, ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import { STATUSES, STATUS_COLORS, type Household } from "@relief/shared";
import { Button } from "../components/Button";
import { Input, Textarea } from "../components/Input";
import { Select } from "../components/Select";
import { toast } from "../components/Toast";
import { useI18n } from "../i18n";
import { session } from "../session";

type SortField = "house_number" | "status" | "head_name" | "updated_at";

export default function Dashboard() {
  const { t, statusLabel } = useI18n();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("house_number");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: me } = useQuery({ queryKey: ["session"], queryFn: () => session.get() });
  const isAdmin = me?.role === "admin";

  const { data: households = [] } = useQuery<Household[]>({
    queryKey: ["households"],
    queryFn: () => fetch("/app-api/households").then((r) => r.json()),
    refetchInterval: 30_000,
  });

  const filtered = useMemo(() => {
    let rows = [...households];
    if (statusFilter) rows = rows.filter((h) => h.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (h) =>
          h.house_number.toLowerCase().includes(q) ||
          h.head_name.toLowerCase().includes(q) ||
          h.notes.toLowerCase().includes(q),
      );
    }
    rows.sort((a, b) => {
      const aVal = String(a[sortField] ?? "").toLowerCase();
      const bVal = String(b[sortField] ?? "").toLowerCase();
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return rows;
  }, [households, statusFilter, search, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const startEdit = (h: Household) => {
    setEditingId(h.id);
    setEditStatus(h.status);
    setEditNotes(h.notes);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditStatus("");
    setEditNotes("");
  };

  const saveEdit = async (id: number) => {
    setSaving(true);
    try {
      const res = await fetch(`/app-api/households/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: editStatus, notes: editNotes }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Update failed");
      toast.success(t.statusUpdated);
      queryClient.invalidateQueries({ queryKey: ["households"] });
      cancelEdit();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteHousehold = async (h: Household) => {
    if (!window.confirm(t.deleteHouseholdConfirm)) return;
    setDeletingId(h.id);
    try {
      const res = await fetch(`/app-api/households/${h.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Delete failed");
      toast.success(t.houseDeleted);
      queryClient.invalidateQueries({ queryKey: ["households"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeletingId(null);
    }
  };

  const exportCSV = () => {
    const header = "House Number,Head Name,Residents,Lat,Lng,Status,Notes,Updated\n";
    const rows = filtered
      .map((h) =>
        [
          `"${h.house_number}"`,
          `"${h.head_name}"`,
          h.resident_count,
          h.gps_lat ?? "",
          h.gps_lng ?? "",
          `"${h.status}"`,
          `"${h.notes.replace(/"/g, '""')}"`,
          h.updated_at ?? "",
        ].join(","),
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ragama-households-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-primary">{t.dashboard}</h1>
        <Button variant="secondary" onClick={exportCSV}>
          <Download className="size-4" /> {t.exportCsv}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <Input placeholder={t.search} value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-xs" />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:max-w-xs">
          <option value="">{t.allStatuses}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </Select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-inset text-secondary">
            <tr>
              <Th label={t.houseNumber} field="house_number" sortField={sortField} sortDir={sortDir} onClick={toggleSort} />
              <Th label={t.headName} field="head_name" sortField={sortField} sortDir={sortDir} onClick={toggleSort} />
              <th className="px-3 py-2 text-left font-medium">{t.residents}</th>
              <Th label={t.status} field="status" sortField={sortField} sortDir={sortDir} onClick={toggleSort} />
              <th className="px-3 py-2 text-left font-medium">{t.notes}</th>
              <Th label={t.updated} field="updated_at" sortField={sortField} sortDir={sortDir} onClick={toggleSort} />
              <th className="px-3 py-2 text-left font-medium">{t.action}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((h) => {
              const isEditingRow = editingId === h.id;
              return (
                <tr key={h.id} className="border-t border-border bg-raised">
                  <td className="px-3 py-2 font-medium text-primary whitespace-nowrap">{h.house_number}</td>
                  <td className="px-3 py-2 text-primary">{h.head_name}</td>
                  <td className="px-3 py-2 text-primary">{h.resident_count}</td>
                  <td className="px-3 py-2">
                    {isEditingRow ? (
                      <Select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {statusLabel(s)}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                        style={{ background: STATUS_COLORS[h.status] || "#64748b" }}
                      >
                        {statusLabel(h.status)}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 max-w-[220px]">
                    {isEditingRow ? (
                      <Textarea rows={2} value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
                    ) : (
                      <span className="text-secondary line-clamp-2">{h.notes}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-secondary text-xs">
                    {h.updated_at ? new Date(h.updated_at).toLocaleString() : ""}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {isEditingRow ? (
                      <div className="flex gap-1.5">
                        <Button variant="primary" onClick={() => saveEdit(h.id)} isLoading={saving} className="px-2.5 py-1 text-xs">
                          {t.save}
                        </Button>
                        <Button variant="secondary" onClick={cancelEdit} className="px-2.5 py-1 text-xs">
                          {t.cancel}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Button variant="secondary" onClick={() => startEdit(h)} className="px-2.5 py-1 text-xs">
                          {t.update}
                        </Button>
                        <Link to={`/entry?edit=${h.id}`} title={t.edit}>
                          <Button variant="secondary" className="px-2 py-1 text-xs">
                            <Pencil className="size-3.5" />
                          </Button>
                        </Link>
                        {isAdmin && (
                          <Button
                            variant="danger"
                            onClick={() => deleteHousehold(h)}
                            isLoading={deletingId === h.id}
                            className="px-2 py-1 text-xs"
                            title={t.delete}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-secondary">
                  {t.noHouseholds}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-secondary mt-3">
        {t.showing} {filtered.length} {t.of} {households.length} {t.householdsWord}
      </p>
    </div>
  );
}

function Th({
  label,
  field,
  sortField,
  sortDir,
  onClick,
}: {
  label: string;
  field: SortField;
  sortField: SortField;
  sortDir: "asc" | "desc";
  onClick: (f: SortField) => void;
}) {
  const active = sortField === field;
  return (
    <th
      className="px-3 py-2 text-left font-medium cursor-pointer select-none whitespace-nowrap"
      onClick={() => onClick(field)}
    >
      <span className={`inline-flex items-center gap-1 ${active ? "text-primary" : ""}`}>
        {label}
        <ArrowUpDown className={`size-3 ${active ? "opacity-100" : "opacity-40"}`} />
        {active && <span className="text-[10px]">{sortDir === "asc" ? "↑" : "↓"}</span>}
      </span>
    </th>
  );
}
