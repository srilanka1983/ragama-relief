import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Plus, Table2, Users } from "lucide-react";
import { useI18n } from "../i18n";

export function Nav() {
  const { t, lang, setLang } = useI18n();
  const items = [
    { href: "/", label: t.home, icon: <Home className="size-5" /> },
    { href: "/entry", label: t.add, icon: <Plus className="size-5" /> },
    { href: "/dashboard", label: t.dashboard, icon: <Table2 className="size-5" /> },
    { href: "/users", label: t.users, icon: <Users className="size-5" /> },
  ];

  return (
    <>
      {/* Top bar: desktop nav + language toggle */}
      <div className="hidden md:flex items-center justify-between border-b border-border bg-raised px-4 py-2">
        <div className="flex items-center gap-1">
          {items.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === "/"}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium ${
                  isActive ? "bg-inset text-primary" : "text-secondary hover:text-primary"
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </div>
        <button
          onClick={() => setLang(lang === "en" ? "si" : "en")}
          className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-secondary hover:text-primary"
        >
          {lang === "en" ? "සිංහල" : "English"}
        </button>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 flex items-stretch border-t border-border bg-raised">
        {items.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === "/"}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                isActive ? "text-primary" : "text-secondary"
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
