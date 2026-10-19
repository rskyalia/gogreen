async function CurrentYear() {
    "use cache";
    return <span>{new Date().getFullYear()}</span>;
}

const links = [
    { label: "Beranda", href: "#beranda" },
    { label: "Kategori", href: "#kategori" },
    { label: "Komunitas DIY", href: "#komunitas" },
    { label: "Bank Sampah", href: "#bank-sampah" },
    { label: "Gamifikasi", href: "#gamifikasi" },
    { label: "Contact", href: "#contact" },
];

export default function Footer() {
    return (
        <footer className="bg-forest-deep text-mint">
            <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="font-serif text-lg font-semibold text-white">
                        Go Green Innovation
                    </p>
                    <p className="mt-1 text-sm">Dream It. Build It. Change It.</p>
                </div>
                <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    {links.map((l) => (
                        <a key={l.href} href={l.href} className="transition-colors hover:text-white">
                            {l.label}
                        </a>
                    ))}
                </nav>
            </div>
            <div className="border-t border-white/10">
                <p className="mx-auto max-w-6xl px-5 py-4 text-xs sm:px-8">
                    &copy; <CurrentYear /> Go Green Innovation
                </p>
            </div>
        </footer>
    );
}