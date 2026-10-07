export type Category = "All" | "Ceramics" | "Lighting" | "Furniture" | "Objects";

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  category: Exclude<Category, "All">;
  image: string;
  color: string;
  badge?: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
}

export interface CartItem {
  productId: string;
  quantity: number;
}
