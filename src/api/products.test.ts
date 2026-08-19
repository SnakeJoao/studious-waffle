import { searchProducts } from "./products";
import type { Product } from "../types/product";

function mockResponse(
  json: () => Promise<unknown>,
  init: { ok?: boolean; status?: number } = {},
): Response {
  const { ok = true, status = 200 } = init;
  return { ok, status, json } as Response;
}

describe("searchProducts", () => {
  const controller = new AbortController();
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  it("requests the URL-encoded query with the given abort signal", async () => {
    fetchMock.mockResolvedValue(mockResponse(async () => []));

    await searchProducts("wireless mouse & keyboard", controller.signal);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/products?q=wireless%20mouse%20%26%20keyboard",
      { signal: controller.signal },
    );
  });

  it("resolves with the parsed products on success", async () => {
    const products: Product[] = [{ id: 1, name: "Mouse", price: 20 }];
    fetchMock.mockResolvedValue(mockResponse(async () => products));

    await expect(searchProducts("mouse", controller.signal)).resolves.toEqual(products);
  });

  it("throws an error naming the status code for a non-OK response", async () => {
    fetchMock.mockResolvedValue(mockResponse(async () => ({}), { ok: false, status: 500 }));

    await expect(searchProducts("mouse", controller.signal)).rejects.toThrow(
      "Search request failed (500)",
    );
  });

  it("throws a friendly error when the response body is not valid JSON", async () => {
    fetchMock.mockResolvedValue(
      mockResponse(async () => {
        throw new SyntaxError("Unexpected token '<'");
      }),
    );

    await expect(searchProducts("mouse", controller.signal)).rejects.toThrow(
      "Received an unexpected response from the server.",
    );
  });
});
