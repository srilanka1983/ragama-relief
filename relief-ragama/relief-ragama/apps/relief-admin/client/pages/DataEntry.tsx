import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { STATUSES, type Household } from "@relief/shared";
import { Button } from "../components/Button";
import { Input, Textarea } from "../components/Input";
import { Select } from "../components/Select";
import { FormItem, FormLabel, FormControl, FormDescription } from "../components/Form";
import { toast } from "../components/Toast";
import { useI18n } from "../i18n";

export default function DataEntry() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const { t, statusLabel } = useI18n();

  const [houseNumber, setHouseNumber] = useState("");
  const [headName, setHeadName] = useState("");
  const [residentCount, setResidentCount] = useState(1);
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
        setResidentCount(h.resident_count);
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
      const res = await fetch(isEditing ? `/app-api/households/${editId}` : "/app-api/households", {
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
      <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
        {error && (
          <div className="rounded-md border border-error bg-error-weak p-3 text-sm text-error">{error}</div>
        )}

        <FormItem>
          <FormLabel>{t.houseNumber}</FormLabel>
          <FormControl>
            <Input
              value={houseNumber}
              onChange={(e) => setHouseNumber(e.target.value)}
              placeholder={t.houseNumberPlaceholder}
            />
          </FormControl>
          <FormDescription>{t.houseNumberHint}</FormDescription>
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
            <Input
              type="number"
              min={1}
              max={50}
              value={residentCount}
              onChange={(e) => setResidentCount(Number(e.target.value) || 1)}
            />
          </FormControl>
        </FormItem>

        <FormItem>
          <FormLabel>{t.gpsLocation}</FormLabel>
          <div className="space-y-2">
            <Button type="button" variant="secondary" onClick={captureLocation} isLoading={locating}>
              {gpsLat != null && gpsLng != null ? t.updateGps : t.captureGps}
            </Button>
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

        <div className="flex gap-2 pt-2">
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
