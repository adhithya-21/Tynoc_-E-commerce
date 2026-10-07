"use client";

import Link from "next/link";
import { ArrowUpRight, Heart, Plus } from "lucide-react";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { useCart, useWishlist } from "@/lib/store";

export function ProductCard({ product, onAdd }: { product: Product; onAdd?: (name: string) => void }) {
  const { add } = useCart();
  const { wishlist, toggle } = useWishlist();
  const [added, setAdded] = useState(false);
  const isSaved = wishlist.includes(product.id);

  function addToBag() {
    add(product.id);
    setAdded(true);
    onAdd?.(product.name);
    window.setTimeout(() => setAdded(false), 1500);
  }

  return (
    <article className="product-card">
      <div className="product-image-wrap" style={{ backgroundColor: product.color }}>
        <Link className="product-image-link" href={`/products/${product.slug}`} aria-label={`View ${product.name}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="product-image" src={product.image} alt={product.name} loading="lazy" />
        </Link>
        {product.badge && <span className="product-badge">{product.badge}</span>}
        <button className={`favorite-button ${isSaved ? "is-saved" : ""}`} aria-label={isSaved ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`} onClick={() => toggle(product.id)}>
          <Heart size={17} fill={isSaved ? "currentColor" : "none"} />
        </button>
        <button className={`quick-add-button ${added ? "quick-added" : ""}`} onClick={addToBag} aria-label={`Add ${product.name} to bag`}>
          <span>{added ? "Added to bag" : "Add to bag"}</span><Plus size={16} />
        </button>
        <Link className="product-view-button" href={`/products/${product.slug}`} aria-label={`View ${product.name}`}><ArrowUpRight size={18} /></Link>
      </div>
      <div className="product-meta">
        <div><p className="product-name">{product.name}</p><p className="product-category">{product.category}</p></div>
        <span className="product-price">${product.price.toFixed(2)}</span>
      </div>
    </article>
  );
}
