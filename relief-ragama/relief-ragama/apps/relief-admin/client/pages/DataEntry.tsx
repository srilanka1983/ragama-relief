import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { STATUSES, RESIDENT_COUNT_RANGES, type Household } from "@relief/shared";
import { Button } from "../components/Button";
import { Input, Textarea } from "../components/Input";
import { Select } from "../components/Select";
import { FormItem, FormLabel, FormControl, FormDescription } from "../components/Form";
import { toast } from "../components/Toast";
import { useI18n } from "../i18n";
import { session } from "../session";

export default function DataEntry() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const { t, statusLabel } = useI18n();

  const { data: me } = useQuery({ queryKey: ["session"], queryFn: () => session.get() });
  const isAdmin = me?.role === "admin";

  const [houseNumber, setHouseNumber] = useState("");
  const [headName, setHeadName] = useState("");
  const [residentCount, setResidentCount] = useState<string>("");
  const [gpsLat, setGpsLat] = useState<number | null>(null);
  const [gpsLng, setGpsLng] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("Safe");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");

  const isEditing = !!editId;

  const { data: households = [] } = useQuery<Household[]>({
    queryKey: ["households"],
    queryFn: () => fetch("/app-api/households").then((r) => r.json()),
  });

  useEffect(() => {
    if (editId) {
      const h = households.find((row) => String(row.id) === editId);
      if (h) {
        setHouseNumber(h.house_number);
        setHeadName(h.head_name);
        setResidentCount(String(h.resident_count));
        setGpsLat(h.gps_lat);
        setGpsLng(h.gps_lng);
        setStatus(h.status);
        setNotes(h.notes);
      }
    }
  }, [editId, households]);

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setLocError(t.gpsUnavailable);
      return;
    }
    setLocating(true);
    setLocError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLat(pos.coords.latitude);
        setGpsLng(pos.coords.longitude);
        setLocating(false);
      },
      () => {
        setLocError(t.gpsError);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!houseNumber.trim()) {
      setError(`${t.houseNumber} is required`);
      return;
    }
    if (!residentCount) {
      setError(`${t.residentCount} is required`);
      return;
    }
    setIsSubmitting(true);
    try {
      const body = {
        house_number: houseNumber.trim(),
        head_name: headName.trim(),
        resident_count: residentCount,
        gps_lat: gpsLat,
        gps_lng: gpsLng,
        status,
        notes: notes.trim(),
      };
      const endpoint = isEditing
        ? isAdmin
          ? `/app-api/households/${editId}/admin`
          : `/app-api/households/${editId}`
        : "/app-api/households";
      const res = await fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      toast.success(isEditing ? t.houseUpdated : t.houseAdded);
      queryClient.invalidateQueries({ queryKey: ["households"] });
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-tight text-primary mb-6">
        {isEditing ? t.editHousehold : t.addHousehold}
      </h1>
      <form
        onSubmit={handleSubmit}
        className="max-w-lg space-y-6 rounded-xl border border-border bg-raised p-5 sm:p-6 shadow-xs"
      >
        {error && (
          <div className="rounded-lg border border-error/30 bg-error-weak p-3 text-sm text-error">{error}</div>
        )}

        <FormItem>
          <FormLabel>{t.houseNumber}</FormLabel>
          <FormControl>
            <Input
              value={houseNumber}
              onChange={(e) => setHouseNumber(e.target.value)}
              placeholder={t.houseNumberPlaceholder}
              disabled={isEditing && !isAdmin}
            />
          </FormControl>
          <FormDescription>{isEditing && !isAdmin ? t.houseNumberLockedHint : t.houseNumberHint}</FormDescription>
        </FormItem>

        <FormItem>
          <FormLabel>{t.headOfHousehold}</FormLabel>
          <FormControl>
            <Input value={headName} onChange={(e) => setHeadName(e.target.value)} placeholder={t.fullNamePlaceholder} />
          </FormControl>
        </FormItem>

        <FormItem>
          <FormLabel>{t.residentCount}</FormLabel>
          <FormControl>
            <div className="flex flex-wrap gap-2">
              {RESIDENT_COUNT_RANGES.map((range) => {
                const isSelected = residentCount === range;
                return (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setResidentCount(range)}
                    aria-pressed={isSelected}
                    className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors ${
                      isSelected
                        ? "border-accent bg-accent text-accent-contrast shadow-xs"
                        : "border-border bg-raised text-primary hover:border-accent/40 hover:bg-inset"
                    }`}
                  >
                    {range}
                  </button>
                );
              })}
            </div>
          </FormControl>
          <FormDescription>{t.residentCountHint}</FormDescription>
        </FormItem>

        <FormItem>
          <FormLabel>{t.gpsLocation}</FormLabel>
          <div className="space-y-2">
            <Button
              type="button"
              variant="secondary"
              onClick={captureLocation}
              isLoading={locating}
              disabled={isEditing && !isAdmin}
            >
              {gpsLat != null && gpsLng != null ? t.updateGps : t.captureGps}
            </Button>
            {isEditing && !isAdmin && <p className="text-xs text-secondary">{t.gpsLockedHint}</p>}
            {locError && <p className="text-xs text-error">{locError}</p>}
            {gpsLat != null && gpsLng != null && (
              <p className="text-xs text-secondary">
                {gpsLat.toFixed(6)}, {gpsLng.toFixed(6)}
              </p>
            )}
          </div>
        </FormItem>

        <FormItem>
          <FormLabel>{t.status}</FormLabel>
          <FormControl>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </Select>
          </FormControl>
        </FormItem>

        <FormItem>
          <FormLabel>{t.notes}</FormLabel>
          <FormControl>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t.notesPlaceholder} rows={3} />
          </FormControl>
        </FormItem>

        <div className="flex gap-2 pt-5 border-t border-border -mx-5 sm:-mx-6 px-5 sm:px-6 pb-1">
          <Button type="submit" isLoading={isSubmitting}>
            {isEditing ? t.saveChanges : t.addHousehold}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate("/")}>
            {t.cancel}
          </Button>
        </div>
      </form>
    </div>
  );
}
