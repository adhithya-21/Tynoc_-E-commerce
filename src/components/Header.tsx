"use client";

import Link from "next/link";
import { ArrowRight, Heart, Menu, Search, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { useCart, useWishlist } from "@/lib/store";

interface HeaderProps {
  onSearch?: (value: string) => void;
  onCart?: () => void;
}

export function Header({ onSearch, onCart }: HeaderProps) {
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <div className="announcement">A little something on us — free shipping on orders over $150 <ArrowRight size={13} /></div>
      <header className="site-header">
        <div className="header-inner">
          <button className="icon-button mobile-menu-button" aria-label={mobileOpen ? "Close menu" : "Open menu"} onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
          <nav className={`main-nav ${mobileOpen ? "main-nav-open" : ""}`} aria-label="Main navigation">
            <Link href="/#shop" onClick={() => setMobileOpen(false)}>Shop all</Link>
            <Link href="/#categories" onClick={() => setMobileOpen(false)}>Collections</Link>
            <Link href="/#story" onClick={() => setMobileOpen(false)}>Our story</Link>
          </nav>
          <Link href="/" className="wordmark" aria-label="Form and Field home">form <span>&</span> field<span className="wordmark-period">.</span></Link>
          <div className="header-actions">
            <button className="icon-button search-toggle" aria-label="Search products" onClick={() => setSearchOpen(!searchOpen)}><Search size={20} /></button>
            <Link href="/#shop" className="icon-button wishlist-link" aria-label={`${wishlist.length} saved items`}><Heart size={20} />{wishlist.length > 0 && <span className="action-count">{wishlist.length}</span>}</Link>
            <button className="icon-button bag-button" aria-label={`Open shopping bag, ${cartCount} items`} onClick={onCart}><ShoppingBag size={20} />{cartCount > 0 && <span className="action-count">{cartCount}</span>}</button>
          </div>
        </div>
        {searchOpen && (
          <form className="search-panel" onSubmit={(event) => { event.preventDefault(); setSearchOpen(false); document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }); }}>
            <Search size={19} />
            <input autoFocus aria-label="Search products" placeholder="Try “ceramics” or “vase”..." onChange={(event) => onSearch?.(event.target.value)} />
            <button type="button" aria-label="Close search" onClick={() => setSearchOpen(false)}><X size={18} /></button>
          </form>
        )}
      </header>
    </>
  );
}
