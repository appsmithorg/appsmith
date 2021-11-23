import { BUILDER_PAGE_URL, getApplicationViewerPageURL } from "./routes";

describe("BUILDER_PAGE_URL", () => {
  let location: typeof window.location;
  beforeAll(() => {
    location = window.location;
    delete (window as any).location;
  });

  it("persists embed query param", () => {
    (window as any).location = new URL("https://example.com?embed=true");
    const pageURL = BUILDER_PAGE_URL({
      applicationId: ":applicationId",
      pageId: ":pageId",
    });
    const pageURLObject = new URL(`${window.origin}${pageURL}`);
    expect(pageURLObject.searchParams.get("embed")).toBe("true");
  });

  it("does not append embed query param when it does not exist", () => {
    (window as any).location = new URL("https://example.com");
    const pageURL = BUILDER_PAGE_URL({
      applicationId: ":applicationId",
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

describe("getApplicationViewerPageURL", () => {
  let location: typeof window.location;
  beforeAll(() => {
    location = window.location;
  });

  it("persists embed query param", () => {
    (window as any).location = new URL("https://example.com?embed=true");
    const pageURL = getApplicationViewerPageURL({
      applicationId: ":applicationId",
      pageId: ":pageId",
    });
    const pageURLObject = new URL(`${window.origin}${pageURL}`);
    expect(pageURLObject.searchParams.get("embed")).toBe("true");
  });

  it("does not append embed query param when it does not exist", () => {
    (window as any).location = new URL("https://example.com");
    const pageURL = getApplicationViewerPageURL({
      applicationId: ":applicationId",
      pageId: ":pageId",
    });
    const pageURLObject = new URL(`${window.origin}${pageURL}`);
    expect(pageURLObject.searchParams.get("embed")).toBe(null);
  });

  afterAll(() => {
    window.location = location;
  });
});
