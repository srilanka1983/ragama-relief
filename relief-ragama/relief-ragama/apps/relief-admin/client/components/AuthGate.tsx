import React from "react";
import { useQuery } from "@tanstack/react-query";
import { session, signIn } from "../session";
import { useI18n } from "../i18n";
import { Button } from "./Button";
import { MapPinned } from "lucide-react";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { t, lang, setLang } = useI18n();
  const { data: me, isLoading } = useQuery({
    queryKey: ["session"],
    queryFn: () => session.get(),
  });

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <p className="text-sm text-secondary">{t.loading}</p>
      </div>
    );
  }

  if (!me?.email) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <MapPinned className="size-10 text-primary" />
        <div>
          <h1 className="text-xl font-semibold text-primary">{t.appTitle}</h1>
          <p className="mt-1 text-sm text-secondary">Volunteer &amp; admin console — sign-in required</p>
        </div>
        <Button onClick={signIn}>{t.signIn}</Button>
        <button
          onClick={() => setLang(lang === "en" ? "si" : "en")}
          className="text-xs text-secondary hover:text-primary"
        >
          {lang === "en" ? "සිංහල" : "English"}
        </button>
      </div>
    );
  }

  if (!me.role) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <h1 className="text-lg font-semibold text-primary">{t.welcome}, {me.name ?? me.email}</h1>
        <p className="max-w-sm text-sm text-secondary">
          Your account isn&apos;t set up as a volunteer or admin yet. Ask an existing admin to add{" "}
          <strong className="text-primary">{me.email}</strong> under the Users page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
