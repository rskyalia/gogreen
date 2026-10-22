'use client';

import { useState, type ReactNode } from 'react';
import { Eye, EyeOff, TriangleAlert } from 'lucide-react';

const base =
    'w-full rounded-xl border px-4 py-3 text-sm text-ink placeholder:text-muted transition-colors';
const stateClass = (error?: string) =>
    error ? 'border-red-400 bg-red-50' : 'border-line bg-white';

type FieldProps = {
    id: string;
    label: string;
    type: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    error?: string;
    autoComplete?: string;
};

export function Field({ id, label, type, value, onChange, placeholder, error, autoComplete }: FieldProps) {
    const [show, setShow] = useState(false);
    const isPwd = type === 'password';

    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-ink">
                {label}
            </label>
            <div className="relative mt-1.5">
                <input
                    id={id}
                    type={isPwd && show ? 'text' : type}
                    value={value}
                    autoComplete={autoComplete}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${id}-error` : undefined}
                    className={`${base} ${stateClass(error)} ${isPwd ? 'pr-11' : ''}`}
                />
                {isPwd && (
                    <button
                        type="button"
                        onClick={() => setShow((s) => !s)}
                        aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}
                        className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted hover:text-forest"
                    >
                        {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                    </button>
                )}
            </div>
            {error && (
                <p id={`${id}-error`} className="mt-1.5 text-xs text-red-700">
                    {error}
                </p>
            )}
        </div>
    );
}

export function TextArea({
    id,
    label,
    value,
    onChange,
    placeholder,
    error,
    rows = 3,
}: Omit<FieldProps, 'type' | 'autoComplete'> & { rows?: number }) {
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-ink">
                {label}
            </label>
            <textarea
                id={id}
                rows={rows}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                aria-invalid={!!error}
                className={`mt-1.5 resize-none ${base} ${stateClass(error)}`}
            />
            {error && <p className="mt-1.5 text-xs text-red-700">{error}</p>}
        </div>
    );
}

export function Alert({ tone, children }: { tone: 'error' | 'warning'; children: ReactNode }) {
    const style =
        tone === 'error'
            ? 'border-red-200 bg-red-50 text-red-700'
            : 'border-sun-ink/20 bg-sun text-sun-ink';
    return (
        <div
            role={tone === 'error' ? 'alert' : undefined}
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed ${style}`}
        >
            {tone === 'warning' && <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />}
            <span>{children}</span>
        </div>
    );
}

export function SubmitButton({ loading, children }: { loading: boolean; children: ReactNode }) {
    return (
        <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-forest px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-forest-deep disabled:cursor-not-allowed disabled:opacity-50"
        >
            {children}
        </button>
    );
}