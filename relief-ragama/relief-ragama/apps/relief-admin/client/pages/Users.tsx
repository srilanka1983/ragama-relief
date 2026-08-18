import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Trash2 } from "lucide-react";
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
          {roles.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-lg border border-border bg-raised p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-primary truncate">{u.email}</p>
                <p className="text-xs text-secondary">{u.role === "admin" ? t.admin : t.volunteer}</p>
              </div>
              <button
                onClick={() => removeUser(u.id, u.email)}
                className="text-secondary hover:text-error shrink-0"
                title={t.remove}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          {roles.length === 0 && <p className="text-sm text-secondary">No users added yet.</p>}
        </div>
      )}
    </div>
  );
}
