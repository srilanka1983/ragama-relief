import React from "react";

export function FormItem({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1.5">{children}</div>;
}

export function FormLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-primary">{children}</label>;
}

export function FormControl({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

export function FormDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-secondary">{children}</p>;
}
