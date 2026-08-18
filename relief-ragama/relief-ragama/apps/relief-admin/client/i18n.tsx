import React, { createContext, useContext, useMemo, useState } from "react";
import { dict, STATUS_LABELS, STATUS_SHORT_LABELS, type Lang } from "@relief/shared";

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (typeof dict)["en"];
  statusLabel: (status: string) => string;
  statusShortLabel: (status: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("relief-lang") : null;
    return saved === "si" ? "si" : "en";
  });
  const setLang = (l: Lang) => {
    setLangState(l);
    window.localStorage.setItem("relief-lang", l);
  };
  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      setLang,
      t: dict[lang],
      statusLabel: (status: string) => STATUS_LABELS[lang][status] ?? status,
      statusShortLabel: (status: string) => STATUS_SHORT_LABELS[lang][status] ?? status,
    }),
    [lang],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
