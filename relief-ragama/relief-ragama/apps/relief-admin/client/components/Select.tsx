import React from "react";
import { ChevronDown } from "lucide-react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
}

export function Select({ className = "", children, ...rest }: SelectProps) {
  return (
    <div className="relative">
      <select
        className={`w-full appearance-none rounded-md border border-border bg-raised px-3 py-2 pr-8 text-sm
          text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 ${className}`}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-secondary" />
    </div>
  );
}
