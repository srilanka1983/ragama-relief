import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, Table2, Users, LogOut, Trash2 } from "lucide-react";
import { STATUS_COLORS, type Household } from "@relief/shared";
import { session, signOut } from "../session";
import { useI18n } from "../i18n";
import { Button } from "../components/Button";
import { toast } from "../components/Toast";

export default function Home() {
  const { t, statusLabel } = useI18n();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { data: user } = useQuery({ queryKey: ["session"], queryFn: () => session.get() });
  const { data: households = [] } = useQuery<Household[]>({
    queryKey: ["households"],
    queryFn: () => fetch("/app-api/households").then((r) => r.json()),
    refetchInterval: 30_000,
  });
  const isAdmin = user?.role === "admin";

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

  const firstName = user?.name ? user.name.split(" ")[0] : null;
  const counts = households.reduce(
    (acc: Record<string, number>, h) => {
      acc[h.status] = (acc[h.status] || 0) + 1;
      acc.total++;
      return acc;
    },
    { total: 0 } as Record<string, number>,
  );

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-primary">{t.appTitle}</h1>
          <p className="text-sm text-secondary">
            {firstName ? `${t.hi}, ${firstName}` : t.welcome} — {counts.total} {t.householdsTracked}
          </p>
        </div>
        <button onClick={signOut} className="flex items-center gap-1 text-sm text-secondary hover:text-primary">
          <LogOut className="size-4" />
          {t.signOut}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="rounded-lg border border-border bg-raised p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="size-2.5 rounded-full shrink-0" style={{ background: color }} />
              <span className="text-xs text-secondary">{statusLabel(status)}</span>
            </div>
            <p className="text-lg font-semibold text-primary">{counts[status] || 0}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        <Link to="/entry">
          <Button>
            <Plus className="size-4" /> {t.addHousehold}
          </Button>
        </Link>
        <Link to="/dashboard">
          <Button variant="secondary">
            <Table2 className="size-4" /> {t.dashboard}
          </Button>
        </Link>
        {user?.role === "admin" && (
          <Link to="/users">
            <Button variant="secondary">
              <Users className="size-4" /> {t.users}
            </Button>
          </Link>
        )}
      </div>

      <div className="space-y-2">
        {households.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-secondary">{t.noHouseholds}</p>
            <Link to="/entry" className="mt-2 inline-block">
              <Button variant="secondary">{t.addFirstHousehold}</Button>
            </Link>
          </div>
        )}
        {households.map((h) => (
          <div
            key={h.id}
            className="flex items-center justify-between gap-2 rounded-lg border border-border bg-raised p-3"
          >
            <Link to={`/entry?edit=${h.id}`} className="flex min-w-0 flex-1 items-center justify-between gap-2 hover:opacity-80">
              <div className="min-w-0">
                <p className="text-sm font-medium text-primary truncate">{h.house_number}</p>
                <p className="text-xs text-secondary truncate">
                  {h.head_name} · {h.resident_count} {t.residents}
                </p>
              </div>
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium text-white shrink-0"
                style={{ background: STATUS_COLORS[h.status] || "#64748b" }}
              >
                {statusLabel(h.status)}
              </span>
            </Link>
            {isAdmin && (
              <button
                onClick={() => deleteHousehold(h)}
                disabled={deletingId === h.id}
                className="shrink-0 text-secondary hover:text-error disabled:opacity-50"
                title={t.delete}
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
