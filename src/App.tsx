import { useEffect, useReducer, useState } from "react";
import { searchProducts } from "./api/products";
import { useDebouncedValue } from "./hooks/useDebouncedValue";
import type { Product } from "./types/product";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; products: Product[] }
  | { status: "error"; message: string };

type Action =
  | { type: "search-started" }
  | { type: "search-succeeded"; products: Product[] }
  | { type: "search-failed"; message: string };

const initialState: State = { status: "idle" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "search-started":
      return { status: "loading" };
    case "search-succeeded":
      return { status: "success", products: action.products };
    case "search-failed":
      return { status: "error", message: action.message };
    default:
      return state;
  }
}

const DEBOUNCE_MS = 300;

export default function ProductSearch() {
  const [query, setQuery] = useState("");
  const [state, dispatch] = useReducer(reducer, initialState);

  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS);

  useEffect(() => {
    const trimmedQuery = debouncedQuery.trim();

    if (!trimmedQuery) {
      // Nothing to search for: skip the request entirely. The empty query
      // is hidden at render time below, so stale state here is never shown.
      return;
    }

    const controller = new AbortController();
    dispatch({ type: "search-started" });

    (async () => {
      try {
        const products = await searchProducts(trimmedQuery, controller.signal);
        dispatch({ type: "search-succeeded", products });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          // Request was superseded by a newer one, or the component unmounted.
          return;
        }
        dispatch({
          type: "search-failed",
          message: err instanceof Error ? err.message : "Something went wrong",
        });
      }
    })();

    return () => controller.abort();
  }, [debouncedQuery]);

  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length > 0;

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products"
      />

      {hasQuery && state.status === "loading" && <p>Loading...</p>}
      {hasQuery && state.status === "error" && (
        <p role="alert">{state.message}</p>
      )}
      {hasQuery && state.status === "success" && state.products.length === 0 && (
        <p>No products found for "{trimmedQuery}".</p>
      )}
      {hasQuery &&
        state.status === "success" &&
        state.products.map((product) => (
          <div key={product.id}>
            <h3>{product.name}</h3>
            <span>${product.price}</span>
          </div>
        ))}
    </div>
  );
}
