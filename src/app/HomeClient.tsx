"use client";

import React, { useState, useRef, useMemo } from 'react';

export type Product = {
  listing_id: number;
  title: string;
  price: number;
  category: string;
  url: string;
  image: string;
};

const REVIEWS = [
  { id: 1, name: "Anja", initial: "A", text: "Sehr schöne Kette! Genau wie beschrieben. Schnelle Lieferung!", product: "Anira - Kette mit Anhänger" },
  { id: 2, name: "Birgit", initial: "B", text: "Das Armband ist wunderschön. Sehr gute Verarbeitung. Vielen Dank!", product: "Armband (Häkel- & Perlen)" },
  { id: 3, name: "Claudia", initial: "C", text: "Ich liebe diese Körbchen. Sie sind perfekt für Kleinigkeiten. Super Qualität.", product: "Häkelkörbchen" },
  { id: 4, name: "Diana", initial: "D", text: "Wunderschöne Ohrringe. Sehr leicht und angenehm zu tragen. Bin begeistert.", product: "Ohrringe" },
];

const INITIAL_DISPLAY = 16;
const LOAD_MORE_STEP = 16;
const ETSY_SHOP_URL = "https://handmadewithempathy.etsy.com";

export default function HomeClient({ products }: { products: Product[] }) {
  const [activeCategory, setActiveCategory] = useState("Alle");
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY);
  const [showImpressum, setShowImpressum] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((p) => counts.set(p.category, (counts.get(p.category) ?? 0) + 1));
    const sorted = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
    return [{ name: "Alle", count: products.length }, ...sorted];
  }, [products]);

  const filteredProducts = useMemo(
    () =>
      activeCategory === "Alle"
        ? products
        : products.filter((p) => p.category === activeCategory),
    [activeCategory, products]
  );

  const displayedProducts = filteredProducts.slice(0, displayCount);
  const hasMore = displayCount < filteredProducts.length;

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setDisplayCount(INITIAL_DISPLAY);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollSlider = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: direction === 'left' ? -420 : 420, behavior: 'smooth' });
    }
  };

  const heroProducts = products.slice(0, 3);

  return (
    <main className="min-h-screen bg-[#FCFBF8] text-stone-800 font-sans selection:bg-[#FCECE3]">

      {/* === NAV === */}
      <nav className="sticky top-0 z-50 bg-[#FCFBF8]/85 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="text-xl font-serif font-bold text-[#D6A28A] tracking-[0.2em]">HwE</div>
            <div className="hidden sm:block text-[10px] text-stone-400 uppercase tracking-tight">Handmade With Empathy</div>
          </div>
          <div className="hidden md:flex gap-8 text-sm">
            <button onClick={() => scrollTo('produkte')} className="text-stone-700 hover:text-[#D6A28A] transition-colors">Kollektion</button>
            <button onClick={() => scrollTo('ueber-mich')} className="text-stone-700 hover:text-[#D6A28A] transition-colors">Über mich</button>
            <button onClick={() => scrollTo('kontakt')} className="text-stone-700 hover:text-[#D6A28A] transition-colors">Kontakt</button>
          </div>
          <a
            href={ETSY_SHOP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#D6A28A] text-white text-xs font-medium px-5 py-2.5 rounded-full hover:bg-[#C48D75] transition-colors whitespace-nowrap"
          >
            Etsy-Shop →
          </a>
        </div>
      </nav>

      {/* === HERO === */}
      <section className="bg-gradient-to-br from-[#FCECE3] via-[#FCFBF8] to-white py-16 md:py-24 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block text-[11px] tracking-[0.25em] uppercase text-[#D6A28A] font-medium mb-5 border-b border-[#D6A28A]/40 pb-1">
              Handgefertigt in Hövels
            </div>
            <h1 className="text-5xl md:text-6xl font-serif text-stone-900 leading-[1.05] mb-6">
              Caring <em className="text-[#D6A28A] font-serif">Creativity</em>
            </h1>
            <p className="text-base md:text-lg text-stone-600 mb-8 leading-relaxed max-w-md">
              Mit Liebe und Empathie handgefertigte Schmuck-Unikate. Jedes Stück erzählt seine eigene Geschichte – in natürlichen Materialien und modernem Design.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => scrollTo('produkte')}
                className="bg-stone-900 text-white px-7 py-3.5 rounded-full text-sm font-medium hover:bg-stone-800 transition-colors"
              >
                Kollektion ansehen
              </button>
              <button
                onClick={() => scrollTo('ueber-mich')}
                className="border border-stone-300 bg-white/60 text-stone-700 px-7 py-3.5 rounded-full text-sm font-medium hover:bg-white transition-colors"
              >
                Meine Geschichte
              </button>
            </div>
            <div className="flex items-center gap-8 mt-12 pt-8 border-t border-stone-200/60">
              <div>
                <div className="text-2xl font-serif text-stone-900">{products.length}+</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-stone-500 mt-1">Unikate</div>
              </div>
              <div className="w-px h-10 bg-stone-200"></div>
              <div>
                <div className="text-2xl font-serif text-stone-900 flex items-center gap-1">★ <span>5.0</span></div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-stone-500 mt-1">Etsy-Bewertung</div>
              </div>
              <div className="w-px h-10 bg-stone-200 hidden sm:block"></div>
              <div className="hidden sm:block">
                <div className="text-2xl font-serif text-stone-900">100%</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-stone-500 mt-1">Handarbeit</div>
              </div>
            </div>
          </div>

          {/* Hero collage */}
          {heroProducts.length >= 3 && (
            <div className="relative h-[460px] hidden md:block">
              <a href={heroProducts[0].url} target="_blank" rel="noopener noreferrer" className="absolute top-0 left-0 w-[55%] h-[55%] rounded-2xl overflow-hidden shadow-2xl rotate-[-3deg] z-10 hover:rotate-0 transition-transform duration-500">
                <img src={heroProducts[0].image} alt={heroProducts[0].title} className="w-full h-full object-cover" />
              </a>
              <a href={heroProducts[1].url} target="_blank" rel="noopener noreferrer" className="absolute top-[15%] right-0 w-[50%] h-[50%] rounded-2xl overflow-hidden shadow-2xl rotate-[5deg] z-20 hover:rotate-0 transition-transform duration-500">
                <img src={heroProducts[1].image} alt={heroProducts[1].title} className="w-full h-full object-cover" />
              </a>
              <a href={heroProducts[2].url} target="_blank" rel="noopener noreferrer" className="absolute bottom-0 left-[20%] w-[45%] h-[45%] rounded-2xl overflow-hidden shadow-2xl rotate-[-1deg] z-30 hover:rotate-0 transition-transform duration-500">
                <img src={heroProducts[2].image} alt={heroProducts[2].title} className="w-full h-full object-cover" />
              </a>
            </div>
          )}
        </div>
      </section>

      {/* === PRODUKTE === */}
      <section id="produkte" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <div>
              <div className="text-[11px] tracking-[0.25em] uppercase text-[#D6A28A] mb-2">Schaufenster</div>
              <h2 className="text-3xl md:text-4xl font-serif text-stone-900">Mein Sortiment</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(({ name, count }) => (
                <button
                  key={name}
                  onClick={() => handleCategoryChange(name)}
                  className={`px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all flex items-center gap-1.5 ${
                    activeCategory === name
                      ? 'bg-stone-900 text-white shadow-sm'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {name}
                  <span className={`text-[10px] ${activeCategory === name ? 'text-stone-300' : 'text-stone-400'}`}>
                    {count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {displayedProducts.length === 0 ? (
            <div className="text-center py-20 text-stone-500 text-sm">
              Keine Produkte in dieser Kategorie gefunden.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {displayedProducts.map((p) => (
                  <a
                    key={p.listing_id}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block"
                  >
                    <div className="aspect-square bg-stone-50 rounded-xl overflow-hidden mb-3 relative">
                      <img
                        src={p.image}
                        alt={p.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/15 transition-colors flex items-end justify-end p-3">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] font-medium text-stone-900 tracking-wide">
                          ANSEHEN →
                        </div>
                      </div>
                    </div>
                    <h3 className="text-xs text-stone-700 line-clamp-2 mb-1 leading-snug min-h-[2.25rem]">{p.title}</h3>
                    <p className="text-sm font-medium text-stone-900">{p.price.toFixed(2)} €</p>
                  </a>
                ))}
              </div>

              <div className="mt-10 flex flex-col items-center gap-3">
                {hasMore && (
                  <button
                    onClick={() => setDisplayCount((c) => c + LOAD_MORE_STEP)}
                    className="border border-stone-300 text-stone-700 px-8 py-3 rounded-full text-sm font-medium hover:bg-stone-100 transition-colors"
                  >
                    Mehr laden ({filteredProducts.length - displayCount} weitere)
                  </button>
                )}
                <div className="text-[11px] text-stone-400 tracking-wide">
                  {displayedProducts.length} von {filteredProducts.length} Produkten
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* === ÜBER MICH === */}
      <section id="ueber-mich" className="py-20 px-6 bg-[#F8F5F1]">
        <div className="max-w-5xl mx-auto grid md:grid-cols-5 gap-10 md:gap-14 items-center">
          <div className="md:col-span-2">
            <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=800&q=80"
                className="w-full h-full object-cover"
                alt="Ulrike"
              />
            </div>
          </div>
          <div className="md:col-span-3">
            <div className="text-[11px] tracking-[0.25em] uppercase text-[#D6A28A] mb-2">Hinter dem Schmuck</div>
            <h2 className="text-3xl md:text-4xl font-serif mb-6 text-stone-900">Hallo, ich bin Ulrike</h2>
            <p className="text-stone-600 leading-relaxed mb-4">
              In meiner Werkstatt in Hövels fertige ich mit viel Liebe zum Detail Schmuckstücke und Accessoires an. Mein Ziel ist es, die natürliche Schönheit der Materialien mit handwerklicher Präzision zu verbinden.
            </p>
            <p className="text-stone-700 leading-relaxed mb-8 italic font-serif text-lg">
              "Jedes Stück erzählt eine Geschichte von Geduld und Empathie."
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-stone-500">
              <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#D6A28A]"></span>Handgefertigt</div>
              <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#D6A28A]"></span>Natürliche Materialien</div>
              <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#D6A28A]"></span>Aus Hövels</div>
              <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#D6A28A]"></span>Unikate</div>
            </div>
          </div>
        </div>
      </section>

      {/* === REVIEWS === */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-end mb-10">
            <div>
              <div className="text-[11px] tracking-[0.25em] uppercase text-[#D6A28A] mb-2">Kundenstimmen</div>
              <h2 className="text-3xl md:text-4xl font-serif text-stone-900">Was Käufer sagen</h2>
            </div>
            <div className="hidden md:flex gap-2">
              <button
                onClick={() => scrollSlider('left')}
                className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center text-stone-500 hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-all"
              >
                ←
              </button>
              <button
                onClick={() => scrollSlider('right')}
                className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center text-stone-500 hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-all"
              >
                →
              </button>
            </div>
          </div>
        </div>

        <div
          ref={sliderRef}
          className="flex overflow-x-auto gap-5 px-6 md:px-12 pb-4 snap-x snap-mandatory hide-scrollbar"
          style={{ scrollbarWidth: 'none' }}
        >
          <style dangerouslySetInnerHTML={{ __html: `.hide-scrollbar::-webkit-scrollbar { display: none; }` }} />
          {REVIEWS.map((r) => (
            <div
              key={r.id}
              className="min-w-[80vw] md:min-w-[380px] snap-center shrink-0 bg-[#F8F5F1] p-7 rounded-2xl"
            >
              <div className="text-yellow-500 text-xs tracking-widest mb-4">★★★★★</div>
              <p className="text-stone-700 leading-relaxed mb-6 text-sm">"{r.text}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-stone-200/60">
                <div className="w-10 h-10 rounded-full bg-[#FCECE3] flex items-center justify-center font-bold text-[#D6A28A]">{r.initial}</div>
                <div>
                  <div className="font-medium text-stone-900 text-sm">{r.name}</div>
                  <div className="text-[11px] text-stone-500">Gekauft: {r.product}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* === ETSY CTA === */}
      <section className="py-20 px-6 bg-stone-900 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-[11px] tracking-[0.25em] uppercase text-[#D6A28A] mb-4">Mein vollständiger Katalog</div>
          <h2 className="text-3xl md:text-4xl font-serif mb-6">Entdecke alle Unikate auf Etsy</h2>
          <p className="text-stone-400 mb-8 max-w-lg mx-auto leading-relaxed">
            Sicher kaufen mit Etsys Käuferschutz – schnelle Lieferung direkt aus meiner Werkstatt zu dir nach Hause.
          </p>
          <a
            href={ETSY_SHOP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#D6A28A] text-white px-10 py-4 rounded-full text-sm font-medium hover:bg-[#C48D75] transition-colors"
          >
            Zum Etsy-Shop →
          </a>
        </div>
      </section>

      {/* === FOOTER === */}
      <footer id="kontakt" className="bg-stone-950 text-stone-400 py-14 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          <div>
            <div className="text-2xl font-serif text-white tracking-[0.2em] mb-3">HwE</div>
            <p className="text-xs leading-relaxed">
              Handgefertigte Unikate aus Hövels.<br />
              Mit Liebe und Sorgfalt hergestellt.
            </p>
          </div>
          <div>
            <h4 className="text-white text-xs font-bold mb-4 uppercase tracking-[0.2em]">Kontakt</h4>
            <ul className="text-xs space-y-2">
              <li>Weststr. 4, 57537 Hövels</li>
              <li>Tel: 0160 92817861</li>
              <li>Email: behle60@web.de</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white text-xs font-bold mb-4 uppercase tracking-[0.2em]">Mehr</h4>
            <ul className="text-xs space-y-2">
              <li><a href={ETSY_SHOP_URL} target="_blank" rel="noopener noreferrer" className="hover:text-[#D6A28A] transition-colors">Etsy Shop</a></li>
              <li><button onClick={() => setShowImpressum(true)} className="hover:text-[#D6A28A] transition-colors text-left">Impressum & Rechtliches</button></li>
            </ul>
          </div>
        </div>
        <div className="text-center pt-8 border-t border-stone-800/60 text-[10px] text-stone-600 tracking-[0.2em] uppercase">
          © {new Date().getFullYear()} Handmade with Empathy • Ulrike Behle
        </div>
      </footer>

      {/* === IMPRESSUM MODAL === */}
      {showImpressum && (
        <div className="fixed inset-0 z-[100] bg-stone-900/90 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-3xl p-10 relative">
            <button
              onClick={() => setShowImpressum(false)}
              className="absolute top-6 right-6 text-stone-400 hover:text-stone-900 text-2xl"
            >
              ×
            </button>
            <h2 className="text-2xl font-serif mb-8 border-b pb-4">Impressum</h2>
            <div className="space-y-6 text-sm text-stone-600 leading-relaxed">
              <section>
                <h3 className="font-bold text-stone-900 mb-2">Angaben gemäß § 5 TMG</h3>
                <p>Ulrike Behle<br />Handmade with Empathy<br />Weststr. 4<br />57537 Hövels</p>
              </section>
              <section>
                <h3 className="font-bold text-stone-900 mb-2">Kontakt</h3>
                <p>Telefon: 0160 92817861<br />E-Mail: behle60@web.de</p>
              </section>
              <section>
                <h3 className="font-bold text-stone-900 mb-2">Redaktionell verantwortlich</h3>
                <p>Ulrike Behle<br />Weststr. 4<br />57537 Hövels</p>
              </section>
              <section>
                <h3 className="font-bold text-stone-900 mb-2">EU-Streitschlichtung</h3>
                <p>
                  Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
                  <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="underline">
                    https://ec.europa.eu/consumers/odr/
                  </a>.
                </p>
              </section>
              <p className="text-[10px] pt-8 text-stone-400 italic">
                Hinweis: Als Kleinunternehmer im Sinne von § 19 Abs. 1 UStG wird keine Umsatzsteuer berechnet.
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
