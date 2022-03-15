import { builderURL, viewerURL } from "RouteBuilder";

describe("builderURL", () => {
  let location: typeof window.location;
  beforeAll(() => {
    location = window.location;
    delete (window as any).location;
  });

  it("persists embed query param", () => {
    (window as any).location = new URL("https://example.com?embed=true");
    const pageURL = builderURL({
      applicationSlug: ":applicationSlug",
      pageSlug: ":pageSlug",
      pageId: ":pageId",
    });
    const pageURLObject = new URL(`${window.origin}${pageURL}`);
    expect(pageURLObject.searchParams.get("embed")).toBe("true");
  });

  it("does not append embed query param when it does not exist", () => {
    (window as any).location = new URL("https://example.com");
    const pageURL = builderURL({
      applicationSlug: ":applicationSlug",
      pageSlug: ":pageSlug",
      pageId: ":pageId",
    });
    const pageURLObject = new URL(`${window.origin}${pageURL}`);
    expect(pageURLObject.searchParams.get("embed")).toBe(null);
  });

  afterAll(() => {
    window.location = location;
    jest.clearAllMocks();
  });
});

describe("viewerURL", () => {
  let location: typeof window.location;
  beforeAll(() => {
    location = window.location;
  });

  it("persists embed query param", () => {
    (window as any).location = new URL("https://example.com?embed=true");
    const pageURL = viewerURL({
      applicationSlug: ":applicationSlug",
      pageSlug: ":pageSlug",
      pageId: ":pageId",
    });
    const pageURLObject = new URL(`${window.origin}${pageURL}`);
    expect(pageURLObject.searchParams.get("embed")).toBe("true");
  });

  it("does not append embed query param when it does not exist", () => {
    (window as any).location = new URL("https://example.com");
    const pageURL = viewerURL({
      applicationSlug: ":applicationSlug",
      pageSlug: ":pageSlug",
      pageId: ":pageId",
    });
    const pageURLObject = new URL(`${window.origin}${pageURL}`);
    expect(pageURLObject.searchParams.get("embed")).toBe(null);
  });

  afterAll(() => {
    window.location = location;
  });
});
