"use client";

import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, Check, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import { CartDrawer } from "@/components/CartDrawer";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { categories, products } from "@/lib/products";
import type { Category } from "@/lib/types";
import { useCatalog } from "@/lib/useCatalog";

type Sort = "featured" | "price-low" | "price-high";

export default function HomePage() {
  const { catalog, error: catalogError } = useCatalog(products);
  const [category, setCategory] = useState<Category>("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("featured");
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const filtered = useMemo(() => {
    const results = catalog.filter((product) =>
      (category === "All" || product.category === category) &&
      `${product.name} ${product.description} ${product.category}`.toLowerCase().includes(search.toLowerCase()),
    );
    if (sort === "price-low") results.sort((a, b) => a.price - b.price);
    if (sort === "price-high") results.sort((a, b) => b.price - a.price);
    return results;
  }, [catalog, category, search, sort]);

  function announceAdded(name: string) {
    setToast(`${name} is in your bag`);
    window.setTimeout(() => setToast(""), 2600);
  }

  function subscribe(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setSubscribed(true);
  }

  return (
    <>
      <Header onSearch={setSearch} onCart={() => setCartOpen(true)} />
      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="hero-kicker"><span className="kicker-line" /> GOOD THINGS, GATHERED</span>
            <h1>Make yourself<br />at <em>home.</em></h1>
            <p>Thoughtful things for the everyday.<br />Made slowly. Kept forever.</p>
            <a className="hero-cta" href="#shop">Find your forever piece <span><ArrowDown size={15} /></span></a>
            <div className="hero-footnote"><Sparkles size={15} strokeWidth={1.4} /><span>Small-batch goods, made with a little more love.</span></div>
          </div>
          <div className="hero-image">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1600&q=90" alt="A sunlit, thoughtfully styled living room with natural textures" fetchPriority="high" />
            <div className="hero-note"><span className="hero-note-dot" /><span>A slower kind of living</span></div>
            <div className="hero-image-index">01 / 04</div>
          </div>
          <div className="hero-counter"><span>EST.</span><span>2021</span></div>
        </section>

        <div className="trust-strip"><span>Made by independent makers</span><span className="trust-star">✳</span><span>Thoughtful materials, always</span><span className="trust-star">✳</span><span>Here for the long haul</span></div>

        <section className="categories-section section-pad" id="categories">
          <div className="section-heading"><div><span className="eyebrow">A HOME, YOUR WAY</span><h2>Find your <em>corner.</em></h2></div><a className="text-link" href="#shop">Shop every piece <ArrowUpRight size={16} /></a></div>
          <div className="category-grid">
            {categories.map((item, index) => (
              <button className="category-card" key={item.name} onClick={() => { setCategory(item.name as Category); document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }); }}>
                <div className="category-image-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt="" loading="lazy" />
                  <span className="category-number">0{index + 1}</span>
                  <span className="category-arrow"><ArrowUpRight size={18} /></span>
                </div>
                <span className="category-card-title">{item.name}</span><span className="category-count">{item.count}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="shop-section section-pad" id="shop">
          <div className="section-heading shop-heading"><div><span className="eyebrow">GOOD THINGS, RIGHT THIS WAY</span><h2>The little <em>edit.</em></h2></div><p>Made thoughtfully. Chosen with you in mind.<br />Get to know your next favorite thing.</p></div>
          {catalogError && <p className="catalog-notice" role="status">{catalogError}</p>}
          <div className="shop-toolbar">
            <div className="filter-tabs" role="group" aria-label="Filter products by category">
              {(["All", "Ceramics", "Lighting", "Furniture", "Objects"] as Category[]).map((name) => <button key={name} className={`filter-tab ${category === name ? "filter-active" : ""}`} onClick={() => setCategory(name)}>{name}{category === name && <span className="filter-indicator" />}</button>)}
            </div>
            <label className="sort-control"><SlidersHorizontal size={14} /><span className="sort-label">Sort:</span><select value={sort} aria-label="Sort products" onChange={(event) => setSort(event.target.value as Sort)}><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label>
          </div>
          <div className="product-grid">
            {filtered.map((product) => <ProductCard key={product.id} product={product} onAdd={announceAdded} />)}
          </div>
          {filtered.length === 0 && <div className="no-results"><span className="empty-sparkle">✳</span><h3>No little finds just yet.</h3><p>Try another search or give those filters a little reset.</p><button className="text-link" onClick={() => { setSearch(""); setCategory("All"); }}>Show me everything <ArrowRight size={15} /></button></div>}
          <div className="shop-more"><span>Showing {filtered.length} of our favorite little things</span><a className="text-link" href="#categories">Explore collections <ArrowRight size={15} /></a></div>
        </section>

        <section className="story-section" id="story">
          <div className="story-image">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1200&q=85" alt="Warm morning light falling across a calm, natural home" loading="lazy" />
            <span className="story-image-caption">THE BEAUTY IS IN THE EVERYDAY</span>
          </div>
          <div className="story-copy"><span className="eyebrow">A NOTE FROM US</span><h2>A little less,<br />a little <em>better.</em></h2><p>We believe the things you live with should mean something. So we look for the good stuff — the people, the process, the details — and bring home pieces made to be part of your story.</p><Link className="button-outline" href="/#shop">Get to know us <ArrowUpRight size={16} /></Link><div className="story-signoff">With warmth, <span>the form & field team</span></div></div>
        </section>

        <section className="newsletter-section">
          <div className="newsletter-inner"><span className="eyebrow">A GOOD LETTER, EVERY NOW & THEN</span><h2>A softer kind of <em>inbox.</em></h2><p>Notes from our makers, new finds, and the occasional little treat.<br />No noise, promise.</p>
            {subscribed ? <div className="success-message"><Check size={17} /> You’re on the list. Keep an eye out for a little hello.</div> : <form className="newsletter-form" onSubmit={subscribe}><label className="sr-only" htmlFor="newsletter-email">Your email address</label><input id="newsletter-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Your email address" /><button type="submit" aria-label="Subscribe to newsletter"><ArrowRight size={19} /></button></form>}
            <span className="newsletter-reassurance">Your inbox is a special place. We’ll treat it that way.</span>
          </div>
          <div className="newsletter-decoration" aria-hidden="true"><span className="decoration-ring" /><span className="decoration-dot" /></div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-main"><div className="footer-brand"><Link href="/" className="wordmark">form <span>&</span> field<span className="wordmark-period">.</span></Link><p>Thoughtful things for<br />the everyday.</p></div><div className="footer-links"><div><span className="eyebrow">TAKE A LOOK</span><a href="#shop">Shop all</a><a href="#categories">Collections</a><a href="#story">Our story</a></div><div><span className="eyebrow">WE’RE HERE</span><a href="mailto:hello@formandfield.example">Get in touch</a><a href="#story">Shipping & returns</a><a href="#story">The little details</a></div><div><span className="eyebrow">FOLLOW ALONG</span><a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram ↗</a><a href="https://pinterest.com" target="_blank" rel="noreferrer">Pinterest ↗</a></div></div></div>
        <div className="footer-bottom"><span>© 2025 FORM & FIELD. MADE WITH CARE.</span><span>GOOD THINGS, KEPT FOREVER <span className="footer-heart">♥</span></span><a href="#">BACK TO TOP ↑</a></div>
      </footer>
      <CartDrawer products={catalog} open={cartOpen} onClose={() => setCartOpen(false)} />
      {toast && <div className="toast-message" role="status"><Check size={16} />{toast}<button aria-label="Dismiss notification" onClick={() => setToast("")}><X size={15} /></button></div>}
    </>
  );
}
