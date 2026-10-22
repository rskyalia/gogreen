"use client";

import { useState } from "react";
import { AtSign, Mail, Star } from "lucide-react";

type Kind = "ulasan" | "kontak";

const kinds: { key: Kind; label: string }[] = [
    { key: "ulasan", label: "Kirim ulasan" },
    { key: "kontak", label: "Hubungi kami" },
];

const contacts = [
    { label: "Email", value: "halo@gogreen.example", Icon: Mail },
    { label: "Media sosial", value: "@gogreen.innovation", Icon: AtSign },
];

const reviews = [
    { name: "Rina", rating: 5, text: "Jadi tahu botol bekas bisa dibuat pot. Tutorialnya jelas dan gampang diikuti." },
    { name: "Dimas", rating: 4, text: "Peta bank sampahnya membantu, tinggal pilih yang paling dekat dari rumah." },
];

function Stars({ value }: { value: number }) {
    return (
        <span className="flex gap-0.5 text-sun-ink" aria-label={`Rating ${value} dari 5`}>
            {Array.from({ length: 5 }, (_, i) => (
                <Star
                    key={i}
                    className={`size-4 ${i < value ? "fill-current" : "text-line"}`}
                    aria-hidden
                />
            ))}
        </span>
    );
}

const inputClass =
    "mt-1.5 w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink placeholder:text-muted";

export default function Contact() {
    const [kind, setKind] = useState<Kind>("ulasan");
    const [rating, setRating] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [sent, setSent] = useState(false);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (kind === "ulasan" && rating === 0) {
            setError("Pilih rating dulu sebelum mengirim ulasan.");
            return;
        }
        setError(null);
        setSent(true);
    };

    const reset = () => {
        setSent(false);
        setRating(0);
    };

    return (
        <section id="contact" className="bg-mist/50">
            <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_1.1fr] lg:gap-14 lg:py-24">
                <div>
                    <h2 className="font-serif text-3xl font-medium leading-tight text-forest sm:text-4xl">
                        Ulasan dan hubungi kami
                    </h2>
                    <p className="mt-4 max-w-md leading-relaxed text-muted">
                        Punya masukan untuk Go Green Innovation, atau ingin bertanya dan
                        bekerja sama? Tulis saja, kami baca.
                    </p>

                    <ul className="mt-7 space-y-4">
                        {contacts.map(({ label, value, Icon }) => (
                            <li key={label} className="flex items-center gap-4">
                                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-leaf text-white">
                                    <Icon className="size-5" aria-hidden />
                                </span>
                                <div>
                                    <p className="text-sm text-muted">{label}</p>
                                    <p className="font-semibold text-ink">{value}</p>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-10 space-y-3">
                        <h3 className="text-sm font-semibold text-ink">Kata mereka</h3>
                        {reviews.map((r) => (
                            <figure key={r.name} className="rounded-2xl border border-line bg-white p-5">
                                <Stars value={r.rating} />
                                <blockquote className="mt-3 text-sm leading-relaxed text-ink/80">
                                    {r.text}
                                </blockquote>
                                <figcaption className="mt-3 text-sm font-semibold text-forest">
                                    {r.name}
                                </figcaption>
                            </figure>
                        ))}
                    </div>
                </div>

                <div className="self-start rounded-[28px] border border-line bg-white p-6 sm:p-8">
                    {sent ? (
                        <div className="py-10 text-center">
                            <h3 className="font-serif text-2xl font-medium text-forest">
                                Terima kasih atas masukanmu
                            </h3>
                            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted">
                                Pesanmu sudah kami catat. Kamu bisa kirim lagi kapan saja.
                            </p>
                            <button
                                type="button"
                                onClick={reset}
                                className="mt-6 rounded-full border border-forest/30 px-5 py-2.5 text-sm font-semibold text-forest transition-colors hover:bg-mist"
                            >
                                Kirim pesan lain
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="inline-flex rounded-full bg-mist p-1" role="group" aria-label="Jenis pesan">
                                {kinds.map(({ key, label }) => (
                                    <button
                                        key={key}
                                        type="button"
                                        aria-pressed={kind === key}
                                        onClick={() => {
                                            setKind(key);
                                            setError(null);
                                        }}
                                        className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${kind === key ? "bg-forest text-white" : "text-forest"
                                            }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="contact-name" className="text-sm font-medium text-ink">
                                        Nama
                                    </label>
                                    <input
                                        id="contact-name"
                                        name="name"
                                        required
                                        autoComplete="name"
                                        placeholder="Nama kamu"
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="contact-email" className="text-sm font-medium text-ink">
                                        Email
                                    </label>
                                    <input
                                        id="contact-email"
                                        name="email"
                                        type="email"
                                        required
                                        autoComplete="email"
                                        placeholder="kamu@email.com"
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            {kind === "ulasan" && (
                                <fieldset className="mt-4">
                                    <legend className="text-sm font-medium text-ink">Rating</legend>
                                    <div className="mt-1.5 flex gap-1">
                                        {[1, 2, 3, 4, 5].map((n) => (
                                            <button
                                                key={n}
                                                type="button"
                                                onClick={() => {
                                                    setRating(n);
                                                    setError(null);
                                                }}
                                                aria-label={`${n} bintang`}
                                                aria-pressed={rating === n}
                                                className="rounded-md p-1 text-sun-ink"
                                            >
                                                <Star
                                                    className={`size-7 ${n <= rating ? "fill-current" : "text-line"}`}
                                                    aria-hidden
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </fieldset>
                            )}

                            <div className="mt-4">
                                <label htmlFor="contact-message" className="text-sm font-medium text-ink">
                                    {kind === "ulasan" ? "Ulasanmu" : "Pesanmu"}
                                </label>
                                <textarea
                                    id="contact-message"
                                    name="message"
                                    required
                                    rows={5}
                                    placeholder={
                                        kind === "ulasan"
                                            ? "Ceritakan pengalamanmu memakai Go Green Innovation"
                                            : "Tulis pertanyaan atau pesanmu di sini"
                                    }
                                    className={`${inputClass} resize-y`}
                                />
                            </div>

                            {error && (
                                <p role="alert" className="mt-3 text-sm font-medium text-sun-ink">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                className="mt-6 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-forest-deep"
                            >
                                {kind === "ulasan" ? "Kirim ulasan" : "Kirim pesan"}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </section>
    );
}