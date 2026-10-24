import { Clock, ExternalLink, MapPin } from "lucide-react";
import { BANK_HOURS, BANK_NAME, EMBED_MAP_URL, MAPS_SHARE_URL } from "@/lib/bank-map";

export default function NearbyBankMap() {
  return (
    <section className="rounded-xl border border-line bg-white p-6 sm:p-8">
      <h2 className="font-serif text-xl font-medium text-forest">Bank sampah terdekat</h2>
      <p className="mt-1 text-sm text-muted">
        Sampah yang tidak bisa diolah sendiri bisa disetor ke sini.
      </p>

      <div className="mt-5 grid gap-5 lg:grid-cols-[320px_1fr]">
        <div className="self-start rounded-2xl border border-line bg-white p-5">
          <div className="flex items-start gap-3">
            <MapPin className="size-5 shrink-0 text-leaf" aria-hidden />
            <div>
              <h3 className="font-semibold text-ink">{BANK_NAME}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Klik tombol di bawah untuk melihat detail lokasi penuh langsung di aplikasi Google Maps.
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 border-t border-line/60 pt-4 text-xs text-muted">
            <Clock className="size-4 shrink-0 text-leaf" aria-hidden />
            <span>{BANK_HOURS}</span>
          </div>

          <a
            href={MAPS_SHARE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-forest px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-forest-deep"
          >
            Buka di Google Maps
            <ExternalLink className="size-4" aria-hidden />
          </a>
        </div>

        <div className="h-[320px] overflow-hidden rounded-xl border border-line bg-mist sm:h-[380px]">
          <iframe
            title="Lokasi bank sampah"
            src={EMBED_MAP_URL}
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-full w-full"
          />
        </div>
      </div>
    </section>
  );
}