import { ChevronDown } from 'lucide-react';
import { FieldWrapper } from './Input';

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?:     string;
  hint?:      string;
  error?:     string;
  wrapClass?: string;
  children:   React.ReactNode;
}

export function Select({
  label,
  hint,
  error,
  required,
  id,
  wrapClass = '',
  className = '',
  children,
  ...props
}: SelectProps) {
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
      {/* Wrapper relative agar ikon chevron bisa diposisikan absolut */}
      <div className="relative">
        <select
          id={fieldId}
          required={required}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined
          }
          className={[
            'field-base appearance-none pr-9',
            error ? 'field-error' : '',
            className,
          ].join(' ')}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          size={15}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
      </div>
    </FieldWrapper>
  );
}
