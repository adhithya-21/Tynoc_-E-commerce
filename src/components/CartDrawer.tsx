"use client";

import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import Image from "next/image";
import type { Product } from "@/lib/types";
import { useCart } from "@/lib/store";

export function CartDrawer({ products, open, onClose }: { products: Product[]; open: boolean; onClose: () => void }) {
  const { cart, update, remove } = useCart();
  const entries = cart.map((item) => ({ ...item, product: products.find((product) => product.id === item.productId) })).filter((item) => item.product);
  const subtotal = entries.reduce((sum, item) => sum + item.product!.price * item.quantity, 0);

  return (
    <>
      {open && <button className="drawer-backdrop" aria-label="Close cart" onClick={onClose} />}
      <aside className={`cart-drawer ${open ? "cart-drawer-open" : ""}`} aria-hidden={!open} aria-label="Shopping bag">
        <div className="drawer-header"><div><span className="eyebrow">YOUR LITTLE FINDS</span><h2>Your bag <span>({cart.reduce((n, item) => n + item.quantity, 0)})</span></h2></div><button className="icon-button" onClick={onClose} aria-label="Close shopping bag"><X size={21} /></button></div>
        {entries.length === 0 ? (
          <div className="cart-empty"><span className="empty-bag"><ShoppingBag size={26} /></span><h3>It’s looking a little empty.</h3><p>There are lovely things waiting to come home with you.</p><button className="button-dark" onClick={onClose}>Find your favorites <span>↗</span></button></div>
        ) : (
          <>
            <div className="cart-items">{entries.map(({ product, quantity }) => product && (
              <div className="cart-item" key={product.id}>
                <div className="cart-item-image" style={{ backgroundColor: product.color }}><Image src={product.image} alt={product.name} fill sizes="88px" /></div>
                <div className="cart-item-info"><div className="cart-item-title"><div><h3>{product.name}</h3><p>{product.category}</p></div><button className="remove-item" aria-label={`Remove ${product.name}`} onClick={() => remove(product.id)}><Trash2 size={15} /></button></div><div className="cart-item-bottom"><div className="quantity-control"><button aria-label={`Decrease ${product.name} quantity`} onClick={() => update(product.id, quantity - 1)}><Minus size={13} /></button><span>{quantity}</span><button aria-label={`Increase ${product.name} quantity`} onClick={() => update(product.id, quantity + 1)}><Plus size={13} /></button></div><span className="cart-item-price">${(product.price * quantity).toFixed(2)}</span></div></div>
              </div>
            ))}</div>
            <div className="cart-footer"><p className="shipping-note">{subtotal >= 150 ? "Lovely! Your order ships free." : `You're $${(150 - subtotal).toFixed(2)} away from free shipping.`}</p><div className="cart-subtotal"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div><p className="tax-note">Shipping & taxes are calculated at checkout.</p><button className="button-dark checkout-button" onClick={() => window.alert("Thanks for stopping by! Checkout is coming soon.")}>Continue to checkout <span>→</span></button></div>
          </>
        )}
      </aside>
    </>
  );
}
