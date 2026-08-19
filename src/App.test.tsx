import { act, fireEvent, render, screen } from "@testing-library/react";
import ProductSearch from "./App";
import { searchProducts } from "./api/products";
import type { Product } from "./types/product";

jest.mock("./api/products", () => ({
  searchProducts: jest.fn(),
}));

const searchProductsMock = searchProducts as jest.Mock;

function typeQuery(value: string) {
  fireEvent.change(screen.getByPlaceholderText("Search products"), {
    target: { value },
  });
}

async function settleDebounce(ms = 300) {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  searchProductsMock.mockReset();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("ProductSearch", () => {
  it("does not call the API when the query is empty or only whitespace", async () => {
    render(<ProductSearch />);

    typeQuery("   ");
    await settleDebounce();

    expect(searchProductsMock).not.toHaveBeenCalled();
  });

  it("debounces rapid typing into a single request for the final value", async () => {
    searchProductsMock.mockResolvedValue([]);
    render(<ProductSearch />);

    typeQuery("l");
    await settleDebounce(100);
    typeQuery("la");
    await settleDebounce(100);
    typeQuery("laptop");
    await settleDebounce();

    expect(searchProductsMock).toHaveBeenCalledTimes(1);
    expect(searchProductsMock).toHaveBeenCalledWith("laptop", expect.any(AbortSignal));
  });

  it("shows a loading state, then renders results each with a stable key", async () => {
    let resolveSearch!: (products: Product[]) => void;
    searchProductsMock.mockImplementation(
      () => new Promise<Product[]>((resolve) => { resolveSearch = resolve; }),
    );
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

    render(<ProductSearch />);
    typeQuery("laptop");
    await settleDebounce();

    expect(screen.getByText("Loading...")).toBeInTheDocument();

    await act(async () => {
      resolveSearch([
        { id: 1, name: "Laptop A", price: 999 },
        { id: 2, name: "Laptop B", price: 1200 },
      ]);
    });

    expect(screen.getByText("Laptop A")).toBeInTheDocument();
    expect(screen.getByText("Laptop B")).toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();

    const missingKeyWarning = consoleError.mock.calls.some((call) =>
      String(call[0]).includes('unique "key" prop'),
    );
    expect(missingKeyWarning).toBe(false);
    consoleError.mockRestore();
  });

  it("shows an empty state when the search succeeds with no results", async () => {
    searchProductsMock.mockResolvedValue([]);
    render(<ProductSearch />);

    typeQuery("nonexistent");
    await settleDebounce();

    expect(screen.getByText('No products found for "nonexistent".')).toBeInTheDocument();
  });

  it("shows an error message when the request fails", async () => {
    searchProductsMock.mockRejectedValue(new Error("Search request failed (500)"));
    render(<ProductSearch />);

    typeQuery("laptop");
    await settleDebounce();

    expect(screen.getByRole("alert")).toHaveTextContent("Search request failed (500)");
  });

  it("silently ignores an aborted request instead of showing an error", async () => {
    searchProductsMock.mockRejectedValue(new DOMException("Aborted", "AbortError"));
    render(<ProductSearch />);

    typeQuery("laptop");
    await settleDebounce();

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("aborts the in-flight request when a newer query supersedes it", async () => {
    const calls: { query: string; signal: AbortSignal }[] = [];
    searchProductsMock.mockImplementation((query: string, signal: AbortSignal) => {
      calls.push({ query, signal });
      return new Promise<Product[]>(() => {});
    });

    render(<ProductSearch />);

    typeQuery("laptop");
    await settleDebounce();

    typeQuery("phone");
    await settleDebounce();

    expect(calls).toHaveLength(2);
    expect(calls[0].query).toBe("laptop");
    expect(calls[0].signal.aborted).toBe(true);
    expect(calls[1].query).toBe("phone");
    expect(calls[1].signal.aborted).toBe(false);
  });

  it("aborts the in-flight request on unmount and never updates state afterwards", async () => {
    let capturedSignal: AbortSignal | undefined;
    searchProductsMock.mockImplementation((_query: string, signal: AbortSignal) => {
      capturedSignal = signal;
      return new Promise<Product[]>(() => {});
    });
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

    const { unmount } = render(<ProductSearch />);
    typeQuery("laptop");
    await settleDebounce();

    unmount();

    expect(capturedSignal?.aborted).toBe(true);
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
