/*
 * components/ui/index.ts
 * Barrel export — impor dari "@/components/ui" untuk semua komponen dasar.
 */

export { Button }          from './Button';
export type { ButtonVariant, ButtonSize } from './Button';

export { Card, CardHeader, CardDivider } from './Card';

export { Badge, statusVariant } from './Badge';
export type { BadgeVariant }    from './Badge';

export { StatusBadge }     from './StatusBadge';

export { Input, FieldWrapper }   from './Input';
export type { InputProps, FieldWrapperProps } from './Input';

export { Select }          from './Select';
export type { SelectProps } from './Select';

export { Textarea }        from './Textarea';
export type { TextareaProps } from './Textarea';

export { PageHeader }      from './PageHeader';
export { StatCard, TONE_CHIP } from './StatCard';
export type { StatCardTone }   from './StatCard';

export { DataTable }       from './DataTable';
export type { Column, PaginationMeta } from './DataTable';

export { ConfirmModal }    from './ConfirmModal';

export { ToastProvider, useToast } from './Toast';
export type { ToastVariant }       from './Toast';

export { EmptyState }      from './EmptyState';

export {
  Skeleton,
  SkeletonText,
  SkeletonTable,
  SkeletonStatCard,
}                          from './LoadingSkeleton';
