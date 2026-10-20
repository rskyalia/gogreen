import { FieldWrapper } from './Input';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?:     string;
  hint?:      string;
  error?:     string;
  wrapClass?: string;
}

export function Textarea({
  label,
  hint,
  error,
  required,
  id,
  wrapClass = '',
  className = '',
  rows = 3,
  ...props
}: TextareaProps) {
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
      <textarea
        id={fieldId}
        rows={rows}
        required={required}
        aria-invalid={!!error}
        aria-describedby={
          error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined
        }
        className={[
          'field-base resize-y',
          error ? 'field-error' : '',
          className,
        ].join(' ')}
        {...props}
      />
    </FieldWrapper>
  );
}
