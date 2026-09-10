import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Trash2, Pencil } from "lucide-react";
import type { UserRole } from "@relief/shared";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Select } from "../components/Select";
import { toast } from "../components/Toast";
import { useI18n } from "../i18n";

export default function Users() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"volunteer" | "admin">("volunteer");
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRole, setEditRole] = useState<"volunteer" | "admin">("volunteer");
  const [savingRole, setSavingRole] = useState(false);

  const { data: roles = [], isLoading } = useQuery<UserRole[]>({
    queryKey: ["user-roles"],
    queryFn: () => fetch("/app-api/user-roles").then((r) => r.json()),
  });

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/app-api/user-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success(`${email.trim()} added as ${role}`);
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const removeUser = async (id: number, userEmail: string) => {
    try {
      const res = await fetch(`/app-api/user-roles/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success(`${userEmail} removed`);
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const startEditRole = (u: UserRole) => {
    setEditingId(u.id);
    setEditRole(u.role as "volunteer" | "admin");
  };

  const cancelEditRole = () => {
    setEditingId(null);
  };

  const saveRole = async (u: UserRole) => {
    setSavingRole(true);
    try {
      const res = await fetch("/app-api/user-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: u.email, role: editRole }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success(t.roleUpdated);
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
      setEditingId(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingRole(false);
    }
  };

  return (
    <div className="mx-auto max-w-[800px] px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-tight text-primary mb-6">{t.users}</h1>

      <form onSubmit={addUser} className="flex flex-col sm:flex-row gap-2 mb-6">
        <Input
          type="email"
          required
          placeholder={t.email}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="sm:flex-1"
        />
        <Select value={role} onChange={(e) => setRole(e.target.value as "volunteer" | "admin")} className="sm:w-40">
          <option value="volunteer">{t.volunteer}</option>
          <option value="admin">{t.admin}</option>
        </Select>
        <Button type="submit" isLoading={submitting}>
          <UserPlus className="size-4" /> {t.addUser}
        </Button>
      </form>

      {isLoading ? (
        <p className="text-sm text-secondary">{t.loading}</p>
      ) : (
        <div className="space-y-2">
          {roles.map((u) => {
            const isEditingRow = editingId === u.id;
            return (
              <div key={u.id} className="flex items-center justify-between rounded-lg border border-border bg-raised p-3 gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-primary truncate">{u.email}</p>
                  {isEditingRow ? (
                    <Select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as "volunteer" | "admin")}
                      className="mt-1 w-40"
                    >
                      <option value="volunteer">{t.volunteer}</option>
                      <option value="admin">{t.admin}</option>
                    </Select>
                  ) : (
                    <p className="text-xs text-secondary">{u.role === "admin" ? t.admin : t.volunteer}</p>
                  )}
                </div>
                {isEditingRow ? (
                  <div className="flex gap-1.5 shrink-0">
                    <Button variant="primary" onClick={() => saveRole(u)} isLoading={savingRole} className="px-2.5 py-1 text-xs">
                      {t.save}
                    </Button>
                    <Button variant="secondary" onClick={cancelEditRole} className="px-2.5 py-1 text-xs">
                      {t.cancel}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => startEditRole(u)}
                      className="text-secondary hover:text-primary"
                      title={t.edit}
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => removeUser(u.id, u.email)}
                      className="text-secondary hover:text-error"
                      title={t.remove}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {roles.length === 0 && <p className="text-sm text-secondary">No users added yet.</p>}
        </div>
      )}
    </div>
  );
}
