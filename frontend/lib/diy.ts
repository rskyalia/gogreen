import {
    Cylinder,
    GlassWater,
    Lamp,
    Leaf,
    Package,
    Shirt,
    type LucideIcon,
} from "lucide-react";
import { api } from "./api";
import { tutorials as staticTutorials } from "./tutorials";

export type Tutorial = {
    id: string;
    title: string;
    category: string;
    by: string;
    time: string;
    level: string;
    summary: string;
    tip?: string;
    materials: string[];
    steps: string[];
    rewardPoints: number;
    videoUrl: string | null;
    image: string | null;
    Icon: LucideIcon;
    tone: string;
};

const USE_API = process.env.NEXT_PUBLIC_DIY_SOURCE === "api";
const DIY_ENDPOINT = "/user/diy-guides";

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api").replace(/\/api\/?$/, "");

type Named = { id?: number; name: string } | string | null | undefined;

type DiyGuideDto = {
    id: number;
    title: string;
    description?: string | null;
    difficulty?: string | null;
    estimated_minutes?: number | null;
    materials?: unknown[] | null;
    steps?: unknown[] | null;
    cover_image?: string | null;
    video_url?: string | null;
    reward_points?: number | null;
    category?: Named;
    waste_category?: Named;
    wasteCategory?: Named;
    creator?: Named;
};

type ListResponse = { data: DiyGuideDto[] };

const LEVEL: Record<string, string> = { easy: "Mudah", medium: "Sedang", hard: "Sulit" };

const VISUAL: { match: string; Icon: LucideIcon; tone: string }[] = [
    { match: "plastik", Icon: GlassWater, tone: "bg-mint text-forest" },
    { match: "logam", Icon: Cylinder, tone: "bg-mist text-forest" },
    { match: "organik", Icon: Leaf, tone: "bg-leaf text-white" },
    { match: "kaca", Icon: Lamp, tone: "bg-sun text-sun-ink" },
    { match: "kertas", Icon: Package, tone: "bg-forest text-mint" },
    { match: "tekstil", Icon: Shirt, tone: "bg-mist text-forest" },
];

function visualFor(category: string) {
    const c = category.toLowerCase();
    return VISUAL.find((v) => c.includes(v.match)) ?? { Icon: Leaf, tone: "bg-mint text-forest" };
}

function formatTime(min: number | null | undefined): string {
    if (!min) return "-";
    if (min < 60) return `${min} menit`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m ? `${h} jam ${m} menit` : `${h} jam`;
}

function nameOf(v: Named): string | null {
    if (!v) return null;
    return typeof v === "string" ? v : v.name ?? null;
}

function toText(item: unknown): string {
    if (typeof item === "string") return item;
    if (item && typeof item === "object") {
        const o = item as Record<string, unknown>;
        const v = o.description ?? o.text ?? o.title ?? o.name;
        if (typeof v === "string") return v;
    }
    return "";
}

function imageUrl(path: string | null | undefined): string | null {
    if (!path) return null;
    if (/^https?:\/\//.test(path)) return path;
    return `${API_ORIGIN}/storage/${path.replace(/^\/?(storage\/)?/, "")}`;
}

function toTutorial(d: DiyGuideDto): Tutorial {
    const category = nameOf(d.category) ?? nameOf(d.waste_category) ?? nameOf(d.wasteCategory) ?? "Lainnya";
    const { Icon, tone } = visualFor(category);
    return {
        id: String(d.id),
        title: d.title,
        category,
        by: nameOf(d.creator) ?? "Komunitas",
        time: formatTime(d.estimated_minutes),
        level: d.difficulty ? (LEVEL[d.difficulty] ?? d.difficulty) : "-",
        summary: d.description ?? "",
        materials: (d.materials ?? []).map(toText).filter(Boolean),
        steps: (d.steps ?? []).map(toText).filter(Boolean),
        rewardPoints: d.reward_points ?? 0,
        videoUrl: d.video_url ?? null,
        image: imageUrl(d.cover_image),
        Icon,
        tone,
    };
}

function fromStatic(): Tutorial[] {
    return staticTutorials.map((s) => ({
        id: s.id,
        title: s.title,
        category: s.category,
        by: s.by,
        time: s.time,
        level: s.level,
        summary: s.summary,
        tip: s.tip,
        materials: s.materials,
        steps: s.steps,
        rewardPoints: 0,
        videoUrl: null,
        image: s.image ?? null,
        Icon: s.Icon,
        tone: s.tone,
    }));
}

export async function fetchTutorials(): Promise<Tutorial[]> {
    if (!USE_API) return fromStatic();
    const res = await api.get<ListResponse>(DIY_ENDPOINT);
    return res.data.map(toTutorial);
}