import type { Product } from "../types/product";

export async function searchProducts(
  query: string,
  signal: AbortSignal,
): Promise<Product[]> {
  const response = await fetch(`/api/products?q=${encodeURIComponent(query)}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error(`Search request failed (${response.status})`);
  }

  try {
    return (await response.json()) as Product[];
  } catch {
    throw new Error("Received an unexpected response from the server.");
  }
}
