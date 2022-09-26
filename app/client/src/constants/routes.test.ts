import urlBuilder from "entities/URLRedirect/URLAssembly";
import { builderURL, viewerURL } from "RouteBuilder";

describe("builderURL", () => {
  let location: typeof window.location;
  beforeAll(() => {
    location = window.location;
    delete (window as any).location;
    urlBuilder.updateURLParams(
      {
        applicationSlug: ":applicationSlug",
        applicationId: ":applicationId",
        applicationVersion: 2,
      },
      [
        {
          pageId: ":pageId",
          pageSlug: ":pageSlug",
        },
      ],
    );
  });

  it("persists embed query param", () => {
    (window as any).location = new URL("https://example.com?embed=true");
    const pageURL = builderURL({
      pageId: ":pageId",
    });
    const pageURLObject = new URL(`${window.origin}${pageURL}`);
    expect(pageURLObject.searchParams.get("embed")).toBe("true");
  });

  it("does not append embed query param when it does not exist", () => {
    (window as any).location = new URL("https://example.com");
    const pageURL = builderURL({
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
    urlBuilder.updateURLParams(
      {
        applicationSlug: ":applicationSlug",
        applicationId: ":applicationId",
        applicationVersion: 2,
      },
      [
        {
          pageId: ":pageId",
          pageSlug: ":pageSlug",
        },
      ],
    );
  });

  it("persists embed query param", () => {
    (window as any).location = new URL("https://example.com?embed=true");
    const pageURL = viewerURL({
      pageId: ":pageId",
    });
    const pageURLObject = new URL(`${window.origin}${pageURL}`);
    expect(pageURLObject.searchParams.get("embed")).toBe("true");
  });

  it("does not append embed query param when it does not exist", () => {
    (window as any).location = new URL("https://example.com");
    const pageURL = viewerURL({
      pageId: ":pageId",
    });
    const pageURLObject = new URL(`${window.origin}${pageURL}`);
    expect(pageURLObject.searchParams.get("embed")).toBe(null);
  });

  afterAll(() => {
    window.location = location;
  });
});
