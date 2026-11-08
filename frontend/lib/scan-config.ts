/**
 * lib/scan-config.ts
 * Konfigurasi pilihan scan diambil dari WasteCategory di database.
 * Tidak ada nilai hardcode untuk jenis/kondisi.
 */

import type { WasteCategory } from './waste-categories';

export type Kind = string;
export type Condition = string;

export interface KindOption {
    key: Kind;
    label: string;
    hint: string;
    Icon?: string | null;
    slug: string;
}

export interface ConditionOption {
    key: Condition;
    label: string;
    hint: string;
}

export const conditions: ConditionOption[] = [
    { key: 'bersih', label: 'Bersih', hint: 'Siap diolah' },
    { key: 'kotor', label: 'Kotor', hint: 'Perlu dicuci' },
    { key: 'rusak', label: 'Rusak', hint: 'Retak, sobek, atau busuk' },
];

export function mapCategoriesToKinds(categories: WasteCategory[]): KindOption[] {
    return categories.map((cat) => ({
        key: cat.slug,
        slug: cat.slug,
        label: cat.name,
        hint: cat.description ?? '',
        Icon: cat.icon,
    }));
}

export function isOrganik(kind: string): boolean {
    return kind === 'organik';
}

export function isResidue(kind: string): boolean {
    return kind === 'residu';
}
