"use client";

import { useEffect, useState } from "react";
import type { Product } from "./types";

export function useCatalog(seedProducts: Product[]) {
  const [catalog, setCatalog] = useState(seedProducts);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/products")
      .then(async (response) => {
        if (!response.ok) throw new Error(`Could not load products (${response.status}).`);
        const data = await response.json() as { products: Product[] };
        if (!Array.isArray(data.products)) throw new Error("The product service returned an invalid catalog.");
        if (!cancelled) setCatalog(data.products);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        console.error("Could not load the product catalog:", cause);
        setError("We couldn't refresh the collection right now. Showing the latest saved pieces.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { catalog, error, loading };
}
