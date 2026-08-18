import React, { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  STATUS_SHORT_LABELS,
  dict,
  type Lang,
  type Household,
} from "@relief/shared";

declare global {
  interface Window {
    L: any;
  }
}

const RAGAMA_THUDUWEGEDARA_CENTER: [number, number] = [7.0465, 79.9518];

function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("relief-lang") : null;
    return saved === "si" ? "si" : "en";
  });
  const setLang = (l: Lang) => {
    setLangState(l);
    window.localStorage.setItem("relief-lang", l);
  };
  return [lang, setLang];
}

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersLayer = useRef<any>(null);
  const [leafletReady, setLeafletReady] = useState(false);
  const [selectedHouse, setSelectedHouse] = useState<Household | null>(null);
  const [lang, setLang] = useLang();
  const t = dict[lang];

  const { data: households = [] } = useQuery<Household[]>({
    queryKey: ["households"],
    queryFn: () => fetch("/app-api/households").then((r) => r.json()),
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (window.L) {
      setLeafletReady(true);
      return;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setLeafletReady(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!leafletReady || !mapRef.current || mapInstance.current) return;
    const L = window.L;
    const map = L.map(mapRef.current).setView(RAGAMA_THUDUWEGEDARA_CENTER, 16);
    mapInstance.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    markersLayer.current = L.layerGroup().addTo(map);
  }, [leafletReady]);

  useEffect(() => {
    if (!markersLayer.current || !leafletReady) return;
    const L = window.L;
    markersLayer.current.clearLayers();
    households.forEach((h) => {
      if (h.gps_lat == null || h.gps_lng == null) return;
      const color = STATUS_COLORS[h.status] || "#64748b";
      const shortLabel = STATUS_SHORT_LABELS[lang][h.status] || "?";
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};
          border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.35);
          display:flex;align-items:center;justify-content:center;
          font-size:10px;font-weight:700;color:white;">
          ${shortLabel.charAt(0)}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      const marker = L.marker([h.gps_lat, h.gps_lng], { icon }).addTo(markersLayer.current);
      marker.bindPopup(`
        <div style="font-family:sans-serif;min-width:180px;">
          <strong>${h.house_number}</strong>
          <span style="display:inline-block;margin-left:8px;padding:1px 8px;
            border-radius:999px;font-size:11px;font-weight:600;color:white;
            background:${color};">${STATUS_LABELS[lang][h.status] || h.status}</span>
          <div style="margin-top:4px;">${h.head_name}</div>
          <div style="font-size:12px;color:#64748b;">${h.resident_count} ${t.residents}</div>
          ${h.notes ? `<div style="margin-top:4px;font-size:12px;font-style:italic;">${h.notes}</div>` : ""}
        </div>`);
      marker.on("click", () => setSelectedHouse(h));
    });
  }, [households, leafletReady, lang]);

  return (
    <div className="flex flex-col h-dvh bg-background">
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-raised shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-primary">{t.mapTitle}</h1>
          <p className="text-xs text-secondary">{t.mapSubtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {Object.keys(STATUS_COLORS).map((status) => (
            <span
              key={status}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
              style={{ background: STATUS_COLORS[status as keyof typeof STATUS_COLORS] }}
            >
              {STATUS_SHORT_LABELS[lang][status]}
            </span>
          ))}
          <button
            onClick={() => setLang(lang === "en" ? "si" : "en")}
            className="ml-1 rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-secondary hover:text-primary"
          >
            {lang === "en" ? "සිං" : "EN"}
          </button>
        </div>
      </header>
      <div className="flex-1 relative">
        {!leafletReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-inset z-10">
            <p className="text-sm text-secondary">{t.loading}</p>
          </div>
        )}
        <div ref={mapRef} className="h-full w-full" />
      </div>
      {selectedHouse && (
        <aside className="shrink-0 border-t border-border bg-raised p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <strong className="text-sm text-primary">{selectedHouse.house_number}</strong>
                <span
                  className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                  style={{ background: STATUS_COLORS[selectedHouse.status] }}
                >
                  {STATUS_LABELS[lang][selectedHouse.status]}
                </span>
              </div>
              <p className="text-sm text-primary mt-0.5">{selectedHouse.head_name}</p>
              <p className="text-xs text-secondary">
                {selectedHouse.resident_count} {t.residents}
              </p>
              {selectedHouse.notes && (
                <p className="text-xs text-secondary mt-1 italic">{selectedHouse.notes}</p>
              )}
            </div>
            <button onClick={() => setSelectedHouse(null)} className="text-secondary hover:text-primary">
              ✕
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
