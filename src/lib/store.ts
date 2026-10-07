"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { CartItem } from "./types";

const CART_KEY = "form-field-cart";
const WISHLIST_KEY = "form-field-wishlist";
const EMPTY_CART: CartItem[] = [];
const EMPTY_WISHLIST: string[] = [];
const subscribers = new Set<() => void>();
let cartSnapshot: CartItem[] | undefined;
let wishlistSnapshot: string[] | undefined;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch (error) {
    console.error(`Could not read ${key} from browser storage:`, error);
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
  if (key === CART_KEY) cartSnapshot = value as CartItem[];
  if (key === WISHLIST_KEY) wishlistSnapshot = value as string[];
  subscribers.forEach((subscriber) => subscriber());
}

function getCartSnapshot() {
  cartSnapshot ??= read<CartItem[]>(CART_KEY, []);
  return cartSnapshot;
}

function getServerCartSnapshot() {
  return EMPTY_CART;
}

function getWishlistSnapshot() {
  wishlistSnapshot ??= read<string[]>(WISHLIST_KEY, []);
  return wishlistSnapshot;
}

function getServerWishlistSnapshot() {
  return EMPTY_WISHLIST;
}

function subscribe(subscriber: () => void) {
  subscribers.add(subscriber);
  const handleStorage = (event: StorageEvent) => {
    if (event.key === CART_KEY) cartSnapshot = undefined;
    if (event.key === WISHLIST_KEY) wishlistSnapshot = undefined;
    subscriber();
  };
  window.addEventListener("storage", handleStorage);
  return () => {
    subscribers.delete(subscriber);
    window.removeEventListener("storage", handleStorage);
  };
}

let bootstrapPromise: Promise<void> | undefined;
let apiSyncQueue: Promise<void> = Promise.resolve();

function bootstrapStore() {
  bootstrapPromise ??= fetch("/api/users")
    .then(async (profileResponse) => {
      if (!profileResponse.ok) throw new Error(`Could not initialize shopper session (${profileResponse.status}).`);
      const [cartResponse, wishlistResponse] = await Promise.all([
        fetch("/api/cart"),
        fetch("/api/wishlist"),
      ]);
      if (!cartResponse.ok || !wishlistResponse.ok) {
        throw new Error(`Could not load shopper data (cart: ${cartResponse.status}, wishlist: ${wishlistResponse.status}).`);
      }
      const cartData = await cartResponse.json() as { items: CartItem[] };
      const wishlistData = await wishlistResponse.json() as { productIds: string[] };
      const existingCart = read<CartItem[]>(CART_KEY, []);
      const existingWishlist = read<string[]>(WISHLIST_KEY, []);
      const mergedCart = [...cartData.items];
      for (const localItem of existingCart) {
        const existing = mergedCart.find((item) => item.productId === localItem.productId);
        if (existing) existing.quantity = Math.max(existing.quantity, localItem.quantity);
        else mergedCart.push(localItem);
      }
      write(CART_KEY, mergedCart);
      write(WISHLIST_KEY, [...new Set([...wishlistData.productIds, ...existingWishlist])]);
    })
    .catch((error: unknown) => {
      console.error("Could not load shopper data from the server:", error);
    });
  return bootstrapPromise;
}

function syncWithApi(url: string, method: string, body: object) {
  apiSyncQueue = apiSyncQueue.then(async () => {
    await bootstrapStore();
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`Store sync failed (${response.status}): ${await response.text()}`);
  }).catch((error: unknown) => {
    console.error("Could not sync store changes with the server:", error);
  });
}

export function useCart() {
  useEffect(() => { void bootstrapStore(); }, []);
  const cart = useSyncExternalStore(
    subscribe,
    getCartSnapshot,
    getServerCartSnapshot,
  );
  const add = (productId: string) => {
    const current = read<CartItem[]>(CART_KEY, []);
    const existing = current.find((item) => item.productId === productId);
    write(CART_KEY, existing
      ? current.map((item) => item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item)
      : [...current, { productId, quantity: 1 }]);
    syncWithApi("/api/cart", "POST", { productId, quantity: 1 });
  };
  const update = (productId: string, quantity: number) => {
    const current = read<CartItem[]>(CART_KEY, []);
    write(CART_KEY, quantity < 1
      ? current.filter((item) => item.productId !== productId)
      : current.map((item) => item.productId === productId ? { ...item, quantity } : item));
    syncWithApi("/api/cart", "PATCH", { productId, quantity });
  };
  const remove = (productId: string) => update(productId, 0);
  return { cart, add, update, remove };
}

export function useWishlist() {
  useEffect(() => { void bootstrapStore(); }, []);
  const wishlist = useSyncExternalStore(
    subscribe,
    getWishlistSnapshot,
    getServerWishlistSnapshot,
  );
  const toggle = (productId: string) => {
    const current = read<string[]>(WISHLIST_KEY, []);
    write(WISHLIST_KEY, current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId]);
    syncWithApi("/api/wishlist", "POST", { productId });
  };
  return { wishlist, toggle };
}
