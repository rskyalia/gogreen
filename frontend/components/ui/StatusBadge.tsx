import { Badge, statusVariant } from './Badge';
import type { BadgeVariant } from './Badge';

/**
 * StatusBadge — wrapper tipis di atas Badge yang menerima string status mentah
 * dari API (mis. "verified", "pending", "rejected") dan memilih varian otomatis.
 *
 * Jika label tidak diberikan, status diformat: ganti "_" → spasi + capitalize.
 */

interface StatusBadgeProps {
  status:     string;
  /** Override label teks. Jika kosong, diturunkan dari string status. */
  label?:     string;
  /** Override varian. Jika kosong, dipilih otomatis via statusVariant(). */
  variant?:   BadgeVariant;
  className?: string;
}

function formatStatus(s: string): string {
  return s
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StatusBadge({
  status,
  label,
  variant,
  className,
}: StatusBadgeProps) {
  return (
    <Badge
      variant={variant ?? statusVariant(status)}
      className={className}
    >
      {label ?? formatStatus(status)}
    </Badge>
  );
}
