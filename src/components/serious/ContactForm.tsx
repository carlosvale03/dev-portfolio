"use client";

import { useRef, useState, type FormEvent } from "react";
import type { Ui } from "@/content";
import { ArrowRight } from "../ui/icons";

const ENDPOINT = "https://formspree.io/f/xpwlpbra";
const FIELDS = ["name", "email", "subject", "message"] as const;
type Field = (typeof FIELDS)[number];
type Status = "idle" | "sending" | "sent" | "error";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactForm({ ui }: { ui: Ui }) {
  const t = ui.contact.form;
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [status, setStatus] = useState<Status>("idle");

  const validate = (field: Field, value: string) => {
    if (!value.trim()) return t.required;
    if (field === "email" && !EMAIL.test(value.trim())) return t.invalidEmail;
    return undefined;
  };

  const onBlur = (field: Field, value: string) => setErrors((e) => ({ ...e, [field]: validate(field, value) }));

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next: Partial<Record<Field, string>> = {};
    for (const f of FIELDS) next[f] = validate(f, String(data.get(f) ?? ""));
    setErrors(next);
    const firstInvalid = FIELDS.find((f) => next[f]);
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch(ENDPOINT, { method: "POST", body: data, headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("sent");
      formRef.current?.reset();
    } catch {
      setStatus("error");
    }
  };

  const fieldClass =
    "mt-1.5 w-full border border-fg bg-transparent px-3.5 py-3 text-base outline-none transition-shadow placeholder:text-muted focus:shadow-[4px_4px_0_var(--accent)] aria-[invalid=true]:border-accent-text";

  const renderField = (field: Field, label: string, props: Record<string, unknown> = {}) => {
    const error = errors[field];
    const Tag = field === "message" ? "textarea" : "input";
    return (
      <div className={field === "message" ? "sm:col-span-2" : ""}>
        <label htmlFor={`f-${field}`} className="text-sm font-semibold">
          {label} <span aria-hidden="true" className="text-accent-text">*</span>
        </label>
        <Tag
          id={`f-${field}`}
          name={field}
          required
          aria-invalid={!!error}
          aria-describedby={error ? `e-${field}` : undefined}
          onBlur={(e: { currentTarget: HTMLInputElement | HTMLTextAreaElement }) => onBlur(field, e.currentTarget.value)}
          className={fieldClass}
          {...props}
        />
        {error && (
          <p id={`e-${field}`} className="mt-1.5 text-sm text-accent-text">
            {error}
          </p>
        )}
      </div>
    );
  };

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
      {renderField("name", t.name, { autoComplete: "name", type: "text" })}
      {renderField("email", t.email, { autoComplete: "email", type: "email", inputMode: "email" })}
      <div className="sm:col-span-2">{renderField("subject", t.subject, { type: "text" })}</div>
      {renderField("message", t.message, { rows: 5 })}
      <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={status === "sending"}
          className="group inline-flex h-12 items-center justify-center gap-2 bg-fg px-6 font-semibold text-bg transition-colors hover:bg-accent hover:text-ink disabled:cursor-progress disabled:opacity-60"
        >
          {status === "sending" ? t.sending : t.send}
          <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
        </button>
        <p role="status" aria-live="polite" className="text-sm">
          {status === "sent" && <span className="font-semibold">{t.sent}</span>}
          {status === "error" && <span className="text-accent-text">{t.error}</span>}
        </p>
      </div>
    </form>
  );
}
