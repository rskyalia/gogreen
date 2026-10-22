import {
    Container,
    Cylinder,
    GlassWater,
    Lamp,
    Leaf,
    Package,
    Shirt,
    type LucideIcon,
} from "lucide-react";

export const categories = ["Plastik", "Logam", "Organik", "Kaca", "Kertas", "Tekstil"] as const;
export type Category = (typeof categories)[number];

export type Tutorial = {
    id: string;
    title: string;
    tag: string;
    category: Category;
    by: string;
    time: string;
    level: string;
    likes: number;
    summary: string;
    tip: string;
    materials: string[];
    steps: string[];
    Icon: LucideIcon;
    tone: string;
    image?: string; // path foto (mis. "/images/pot-galon.jpg")
};

export const tutorials: Tutorial[] = [
    {
        id: "botol",
        title: "Kebun vertikal dari botol plastik",
        tag: "Botol plastik",
        category: "Plastik",
        by: "Fajar Ramadhan",
        time: "45 menit",
        level: "Mudah",
        likes: 128,
        summary: "Susun botol bekas jadi kebun kecil yang menempel di dinding.",
        tip: "Pakai botol 1,5 L yang sudah dibilas supaya tanah tidak berbau.",
        materials: ["3 sampai 4 botol plastik 1,5 L", "Tali atau kawat", "Tanah dan bibit", "Cutter"],
        steps: [
            "Cuci botol sampai bersih, lalu potong salah satu sisi badan botol membentuk jendela.",
            "Buat beberapa lubang kecil di dasar botol agar air bisa keluar.",
            "Isi dengan tanah dan tanam bibit.",
            "Ikat botol berjajar ke dinding atau pagar dengan tali.",
        ],
        Icon: GlassWater,
        tone: "bg-mint text-forest",
    },
    {
        id: "galon",
        title: "Pot bunga dari galon bekas",
        tag: "Galon",
        category: "Plastik",
        by: "Rina Lestari",
        time: "30 menit",
        level: "Mudah",
        likes: 96,
        summary: "Galon yang sudah tidak terpakai jadi pot besar untuk tanaman hias.",
        tip: "Lubang drainase di dasar mencegah akar membusuk.",
        materials: ["1 galon bekas", "Cutter", "Cat (opsional)", "Tanah dan tanaman"],
        steps: [
            "Bilas galon sampai bersih dan keringkan.",
            "Potong bagian atas galon dengan cutter, sisakan badannya.",
            "Buat 4 sampai 5 lubang kecil di dasar untuk drainase.",
            "Cat sesuai selera, lalu isi dengan tanah dan tanam.",
        ],
        Icon: Container,
        tone: "bg-sun text-sun-ink",
    },
    {
        id: "kaleng",
        title: "Kaleng lama, meja lebih rapi",
        tag: "Kaleng susu",
        category: "Logam",
        by: "Dimas Pratama",
        time: "20 menit",
        level: "Mudah",
        likes: 87,
        summary: "Kaleng susu bekas dibalut tali atau kain jadi tempat alat tulis.",
        tip: "Haluskan tepi kaleng dengan amplas sebelum dipakai.",
        materials: ["Kaleng bekas", "Amplas", "Tali rami, kertas warna, atau kain", "Lem"],
        steps: [
            "Cuci dan keringkan kaleng, lalu amplas tepi atasnya supaya tidak tajam.",
            "Oleskan lem pada permukaan luar kaleng.",
            "Lilitkan tali atau tempelkan kain dengan rapat.",
            "Keringkan sebelum diisi alat tulis.",
        ],
        Icon: Cylinder,
        tone: "bg-mist text-forest",
    },
    {
        id: "kardus",
        title: "Rak buku dari kardus tebal",
        tag: "Kardus",
        category: "Kertas",
        by: "Sari Wulandari",
        time: "2 jam",
        level: "Sedang",
        likes: 64,
        summary: "Lapisan kardus tebal direkatkan jadi rak buku yang ringan.",
        tip: "Tambah lapisan kardus di alas kalau rak akan menyimpan buku berat.",
        materials: ["Kardus tebal", "Cutter dan penggaris", "Lem", "Kertas pelapis atau cat"],
        steps: [
            "Potong kardus untuk dua sisi, alas, dan sekat sesuai ukuran rak.",
            "Rekatkan 2 sampai 3 lapis kardus pada tiap bagian agar kuat.",
            "Pasang sekat dan alas ke sisi rak, tunggu lem kering.",
            "Lapisi dengan kertas atau cat supaya rapi.",
        ],
        Icon: Package,
        tone: "bg-forest text-mint",
    },
    {
        id: "organik",
        title: "Kompos dari kulit buah",
        tag: "Sampah organik",
        category: "Organik",
        by: "Nadia Putri",
        time: "15 menit, lalu ditunggu",
        level: "Mudah",
        likes: 214,
        summary: "Kulit buah dan sisa sayur diolah jadi pupuk untuk tanaman.",
        tip: "Jaga kelembapan tumpukan, jangan sampai becek.",
        materials: ["Kulit buah dan sisa sayur", "Ember atau wadah berlubang", "Daun kering atau tanah"],
        steps: [
            "Potong kecil-kecil sisa kulit buah dan sayur.",
            "Masukkan ke wadah berlubang, selang-seling dengan daun kering atau tanah.",
            "Aduk secara berkala dan jaga agar tetap lembap, jangan sampai becek.",
            "Setelah beberapa minggu, kompos yang sudah gelap dan tidak berbau bisa dipakai untuk tanaman.",
        ],
        Icon: Leaf,
        tone: "bg-leaf text-white",
    },
    {
        id: "kaca",
        title: "Lampu hias dari botol kaca",
        tag: "Botol kaca",
        category: "Kaca",
        by: "Bagas Saputra",
        time: "40 menit",
        level: "Sedang",
        likes: 52,
        summary: "Botol kaca bekas diberi lampu LED jadi lampu meja yang hangat.",
        tip: "Pakai lampu LED berbaterai, bukan bohlam, supaya aman dan tidak panas.",
        materials: ["Botol kaca bekas", "Lampu LED string berbaterai", "Pita atau tali hias", "Lem tembak"],
        steps: [
            "Cuci botol, lepaskan label sampai bersih, lalu keringkan.",
            "Masukkan lampu LED string ke dalam botol, sisakan kotak baterai di luar.",
            "Rapikan kabel di leher botol dengan lem tembak.",
            "Hias leher botol dengan pita atau tali.",
        ],
        Icon: Lamp,
        tone: "bg-sun text-sun-ink",
    },
    {
        id: "tekstil",
        title: "Tas belanja dari kaos bekas",
        tag: "Kaos bekas",
        category: "Tekstil",
        by: "Lina Hartono",
        time: "25 menit",
        level: "Mudah",
        likes: 71,
        summary: "Kaos lama dipotong dan dijahit jadi tas belanja tanpa pola rumit.",
        tip: "Pilih kaos katun tebal supaya tas kuat membawa belanjaan.",
        materials: ["Kaos bekas", "Gunting", "Jarum dan benang (atau lem kain)"],
        steps: [
            "Potong lengan kaos dan lebarkan lubang leher sampai membentuk tali tas.",
            "Balik kaos, lalu jahit atau rekatkan bagian bawahnya sampai tertutup.",
            "Balik ke sisi luar dan periksa jahitannya.",
            "Cuci dan setrika sebelum dipakai.",
        ],
        Icon: Shirt,
        tone: "bg-mist text-forest",
    },
];

export const getTutorial = (id: string) => tutorials.find((t) => t.id === id);