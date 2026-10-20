"use client";

export function ConfirmForm({
  action,
  message,
  children,
  className = "btn btn-danger",
  fields,
}: {
  action: (formData: FormData) => void | Promise<void>;
  message: string;
  children: React.ReactNode;
  className?: string;
  fields: Record<string, string | number>;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}
