import urlBuilder from "ee/entities/URLRedirect/URLAssembly";
import { builderURL, viewerURL } from "ee/RouteBuilder";

describe("builderURL", () => {
  let location: typeof window.location;
  beforeAll(() => {
    location = window.location;
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).location;
    urlBuilder.updateURLParams(
      {
        applicationSlug: ":applicationSlug",
        baseApplicationId: ":baseApplicationId",
        applicationVersion: 2,
      },
      [
        {
          basePageId: "0123456789abcdef00000000",
          pageSlug: ":pageSlug",
        },
      ],
    );
  });

  it("persists embed query param", () => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).location = new URL("https://example.com?embed=true");
    const pageURL = builderURL({
      basePageId: "0123456789abcdef00000000",
    });
    const pageURLObject = new URL(`${window.origin}${pageURL}`);
    expect(pageURLObject.searchParams.get("embed")).toBe("true");
  });

  it("does not append embed query param when it does not exist", () => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).location = new URL("https://example.com");
    const pageURL = builderURL({
      basePageId: "0123456789abcdef00000000",
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
        baseApplicationId: ":baseApplicationId",
        applicationVersion: 2,
      },
      [
        {
          basePageId: "0123456789abcdef00000000",
          pageSlug: ":pageSlug",
        },
      ],
    );
  });

  it("persists embed query param", () => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).location = new URL("https://example.com?embed=true");
    const pageURL = viewerURL({
      basePageId: "0123456789abcdef00000000",
    });
    const pageURLObject = new URL(`${window.origin}${pageURL}`);
    expect(pageURLObject.searchParams.get("embed")).toBe("true");
  });

  it("does not append embed query param when it does not exist", () => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).location = new URL("https://example.com");
    const pageURL = viewerURL({
      basePageId: "0123456789abcdef00000000",
    });
    const pageURLObject = new URL(`${window.origin}${pageURL}`);
    expect(pageURLObject.searchParams.get("embed")).toBe(null);
  });

  afterAll(() => {
    window.location = location;
  });
});
