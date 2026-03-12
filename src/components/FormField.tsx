interface FormFieldProps {
  label: string;
  id: string;
  children: React.ReactNode;
  hint?: string;
}

export function FormField({ label, id, children, hint }: FormFieldProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
