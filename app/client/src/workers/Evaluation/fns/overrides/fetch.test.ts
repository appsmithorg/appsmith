import type { fetch as guardedFetchFn } from "./fetch";

interface RequestStub {
  init?: RequestInit;
  input: RequestInfo | URL;
}

describe("native fetch dependencies", () => {
  const originalFetch = self.fetch;
  const originalRequest = self.Request;
  const nativeFetch = jest.fn();
  const NativeRequest = jest.fn(function (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): RequestStub {
    return { input, init };
  });
  let guardedFetch: typeof guardedFetchFn;

  beforeEach(async () => {
    jest.resetModules();
    nativeFetch.mockReset().mockResolvedValue({} as Response);
    NativeRequest.mockClear();
    Object.defineProperty(self, "fetch", {
      configurable: true,
      value: nativeFetch,
      writable: true,
    });
    Object.defineProperty(self, "Request", {
      configurable: true,
      value: NativeRequest,
      writable: true,
    });
    ({ fetch: guardedFetch } = await import("./fetch"));
  });

  afterEach(() => {
    Object.defineProperty(self, "fetch", {
      configurable: true,
      value: originalFetch,
      writable: true,
    });
    Object.defineProperty(self, "Request", {
      configurable: true,
      value: originalRequest,
      writable: true,
    });
  });

  it("keeps credentials omitted after the Request global is replaced", async () => {
    const replacementRequest = jest.fn(function (
      input: RequestInfo | URL,
      init?: RequestInit,
    ) {
      return new (NativeRequest as unknown as typeof Request)(input, {
        ...init,
        credentials: "include",
      });
    });

    self.Request = replacementRequest as unknown as typeof Request;

    await guardedFetch("https://appsmith.test/api/test", {
      method: "POST",
    });

    expect(replacementRequest).not.toHaveBeenCalled();
    expect(NativeRequest).toHaveBeenCalledWith(
      "https://appsmith.test/api/test",
      { credentials: "omit", method: "POST" },
    );
    expect(nativeFetch).toHaveBeenCalledWith(
      NativeRequest.mock.results[0].value,
    );
  });

  it("continues to omit credentials during an ordinary call", async () => {
    await guardedFetch("https://appsmith.test/api/test");

    expect(NativeRequest).toHaveBeenCalledWith(
      "https://appsmith.test/api/test",
      { credentials: "omit" },
    );
    expect(nativeFetch).toHaveBeenCalledWith(
      NativeRequest.mock.results[0].value,
    );
  });
});
