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

export function isTekstil(kind: string): boolean {
    return kind === 'tekstil';
}

/**
 * Kembalikan props teks fallback untuk AiRecommendationPanel
 * berdasarkan slug kategori yang dipilih user.
 * Dipakai saat mode image — AI mengidentifikasi sendiri dari foto,
 * tapi props ini jadi fallback jika tidak ada foto.
 */
export function getAiPropsForKind(kind: string): {
    objectName: string;
    material: string;
    wasteType: string;
} {
    switch (kind) {
        case 'organik':
            return { objectName: 'sisa organik (sayur/buah/daun)', material: 'organik', wasteType: 'organic' };
        case 'residu':
            return { objectName: 'sampah residu', material: 'campuran', wasteType: 'residue' };
        case 'tekstil':
            return { objectName: 'pakaian bekas / kain perca', material: 'tekstil (kain)', wasteType: 'recyclable' };
        case 'plastik-pet':
            return { objectName: 'botol plastik PET', material: 'plastik PET', wasteType: 'recyclable' };
        case 'kaca':
            return { objectName: 'botol kaca / toples', material: 'kaca', wasteType: 'recyclable' };
        case 'kaleng':
            return { objectName: 'kaleng aluminium / kaleng baja', material: 'logam', wasteType: 'recyclable' };
        case 'kardus':
            return { objectName: 'kardus / kotak bekas', material: 'kertas tebal', wasteType: 'recyclable' };
        case 'kertas':
            return { objectName: 'kertas bekas / koran', material: 'kertas', wasteType: 'recyclable' };
        default:
            return { objectName: 'bahan daur ulang', material: 'recyclable', wasteType: 'recyclable' };
    }
}
