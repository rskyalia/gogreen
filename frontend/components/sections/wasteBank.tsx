"use client";

import Link from "next/link";
import { Clock, ExternalLink, MapPin } from "lucide-react";

const MAPS_SHARE_URL = "https://share.google/XsNpPlHkfsiFj4Obo";

const EMBED_MAP_URL = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3951.0337080156537!2d112.6168860750072!3d-7.995455992030225!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7882a9d385ba91%3A0x667db69be1ab50c9!2sBank%20Sampah%20Malang!5e0!3m2!1sid!2sid!4v1792681776436!5m2!1sid!2sid";

export default function WasteBank() {
    return (
        <section id="bank-sampah">
            <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
                <div className="max-w-xl">
                    <h2 className="font-serif text-3xl font-medium leading-tight text-forest sm:text-4xl">
                        Bank sampah di sekitarmu
                    </h2>
                    <p className="mt-4 leading-relaxed text-muted">
                        Sampah yang tidak bisa diolah sendiri bisa disetor. Lihat lokasi bank
                        sampah terdekat, lengkap dengan alamat dan petunjuk arah.
                    </p>
                </div>

                <div className="mt-10 grid gap-6 lg:grid-cols-[340px_1fr] lg:gap-8">
                    {/* Kartu Informasi Lokasi */}
                    <div>
                        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
                            <div className="flex items-start gap-3">
                                <MapPin className="size-5 shrink-0 text-leaf" aria-hidden />
                                <div>
                                    <h3 className="font-semibold text-ink">Bank Sampah Utama</h3>
                                    <p className="mt-1 text-xs text-muted leading-relaxed">
                                        Klik tombol di bawah untuk melihat detail lokasi penuh langsung di Aplikasi Google Maps.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center gap-2 border-t border-line/60 pt-4 text-xs text-muted">
                                <Clock className="size-4 text-leaf" aria-hidden />
                                <span>Buka: Senin - Sabtu (08.00 - 16.00 WIB)</span>
                            </div>

                            <a
                                href={MAPS_SHARE_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-forest px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-forest/90"
                            >
                                Buka di Google Maps
                                <ExternalLink className="size-4" />
                            </a>
                        </div>

                        <p className="mt-5 text-sm text-muted">
                            Mengelola bank sampah?{" "}
                            <Link
                                href="/register"
                                className="font-semibold text-forest underline underline-offset-4"
                            >
                                Daftarkan lokasimu
                            </Link>
                        </p>
                    </div>

                    <div className="relative h-[380px] overflow-hidden rounded-[28px] border border-line bg-mist sm:h-[450px]">
                        <iframe
                            title="Lokasi Bank Sampah"
                            src={EMBED_MAP_URL}
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            className="h-full w-full rounded-[28px]"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}