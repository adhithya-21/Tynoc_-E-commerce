"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Heart, Minus, Plus, Star } from "lucide-react";
import { useState } from "react";
import { CartDrawer } from "@/components/CartDrawer";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { products } from "@/lib/products";
import { useCart, useWishlist } from "@/lib/store";
import { useCatalog } from "@/lib/useCatalog";

export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  const { catalog, loading } = useCatalog(products);
  const product = catalog.find((item) => item.slug === params.slug);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { add } = useCart();
  const { wishlist, toggle } = useWishlist();

  if (!product && loading) return <main className="loading-page"><span className="loading-flower">✳</span><p>Gathering the good things...</p><div className="loading-line" /></main>;
  if (!product) notFound();
  const related = catalog.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 3);
  const saved = wishlist.includes(product.id);

  return (
    <>
      <Header onCart={() => setCartOpen(true)} />
      <main className="detail-page">
        <div className="detail-breadcrumb"><Link href="/"><ArrowLeft size={14} /> Back to the good things</Link><span>/</span><span>{product.category}</span><span>/</span><span>{product.name}</span></div>
        <section className="detail-layout">
          <div className="detail-image" style={{ backgroundColor: product.color }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.image} alt={product.name} />
            {product.badge && <span className="product-badge">{product.badge}</span>}
          </div>
          <div className="detail-info"><span className="eyebrow">MADE WITH A LITTLE MORE LOVE</span><h1>{product.name}</h1><div className="detail-rating"><span className="star-row"><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /></span><span>{product.rating} ({product.reviewCount} little love notes)</span></div><p className="detail-price">${product.price.toFixed(2)}</p><div className="detail-divider" /><p className="detail-description">{product.description}</p><div className="detail-perks"><span><Check size={15} /> Thoughtfully made in small batches</span><span><Check size={15} /> Free shipping on orders over $150</span><span><Check size={15} /> Here for the long haul, guaranteed</span></div>          <div className="detail-actions"><div className="detail-quantity"><button aria-label="Decrease quantity" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={15} /></button><span>{quantity}</span><button aria-label="Increase quantity" onClick={() => setQuantity(Math.min(99, quantity + 1))}><Plus size={15} /></button></div><button className={`button-dark detail-add-button ${added ? "detail-added" : ""}`} onClick={() => { for (let i = 0; i < quantity; i++) add(product.id); setAdded(true); window.setTimeout(() => setAdded(false), 1800); }}>{added ? <><Check size={17} /> Added to your bag</> : <>Add to your bag <ArrowRight size={17} /></>}</button><button className={`detail-save-button ${saved ? "is-saved" : ""}`} onClick={() => toggle(product.id)} aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}><Heart size={18} fill={saved ? "currentColor" : "none"} /></button></div><p className="stock-note"><span /> Happily in stock and ready to find a home</p><p className="detail-sku">A GOOD THING NO. {product.id.replace(/\D/g, "")}</p></div>
        </section>
        <section className="related-section section-pad"><div className="section-heading"><div><span className="eyebrow">MORE GOOD THINGS</span><h2>You&apos;ll love these <em>too.</em></h2></div></div><div className="product-grid">{(related.length ? related : catalog.filter((item) => item.id !== product.id).slice(0, 3)).map((item) => <ProductCard key={item.id} product={item} />)}</div></section>
      </main>
      <CartDrawer products={catalog} open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
