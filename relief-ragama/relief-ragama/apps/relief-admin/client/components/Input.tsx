import React from "react";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return (
    <input
      className={`w-full rounded-md border border-border bg-raised px-3 py-2 text-sm text-primary
        placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 ${className}`}
      {...rest}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...rest } = props;
  return (
    <textarea
      className={`w-full rounded-md border border-border bg-raised px-3 py-2 text-sm text-primary
        placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 ${className}`}
      {...rest}
    />
  );
}
