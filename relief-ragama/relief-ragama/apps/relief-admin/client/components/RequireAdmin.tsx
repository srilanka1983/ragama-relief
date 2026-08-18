import React from "react";
import { useQuery } from "@tanstack/react-query";
import { session } from "../session";
import { useI18n } from "../i18n";

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const { data: me, isLoading } = useQuery({ queryKey: ["session"], queryFn: () => session.get() });

  if (isLoading) return <p className="p-6 text-sm text-secondary">{t.loading}</p>;
  if (me?.role !== "admin") {
    return <p className="p-6 text-sm text-error">{t.adminOnly}</p>;
  }
  return <>{children}</>;
}
