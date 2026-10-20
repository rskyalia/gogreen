/* ─── Shared field wrapper ───────────────────────────────────────────────── */

export interface FieldWrapperProps {
  label?:     string;
  hint?:      string;
  error?:     string;
  required?:  boolean;
  id?:        string;
  className?: string;
  children:   React.ReactNode;
}

export function FieldWrapper({
  label,
  hint,
  error,
  required,
  id,
  className = '',
  children,
}: FieldWrapperProps) {
  return (
    <div className={['flex flex-col gap-1', className].join(' ')}>
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-ink leading-none"
        >
          {label}
          {required && (
            <span className="ml-1 text-danger" aria-hidden="true">*</span>
          )}
        </label>
      )}

      {children}

      {error ? (
        <p id={id ? `${id}-error` : undefined} role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={id ? `${id}-hint` : undefined} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/* ─── Input ──────────────────────────────────────────────────────────────── */

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:     string;
  hint?:      string;
  error?:     string;
  wrapClass?: string;
}

export function Input({
  label,
  hint,
  error,
  required,
  id,
  wrapClass = '',
  className = '',
  ...props
}: InputProps) {
  const fieldId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <FieldWrapper
      label={label}
      hint={hint}
      error={error}
      required={required}
      id={fieldId}
      className={wrapClass}
    >
      <input
        id={fieldId}
        required={required}
        aria-invalid={!!error}
        aria-describedby={
          error
            ? `${fieldId}-error`
            : hint
              ? `${fieldId}-hint`
              : undefined
        }
        className={[
          'field-base',
          error ? 'field-error' : '',
          className,
        ].join(' ')}
        {...props}
      />
    </FieldWrapper>
  );
}
