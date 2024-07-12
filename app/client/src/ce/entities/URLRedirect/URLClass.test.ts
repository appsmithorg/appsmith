import type {
  URLBuilderParams,
  ApplicationURLParams,
  PageURLParams,
} from "./URLAssembly";
import urlBuilder, { URLBuilder } from "./URLAssembly";
import { APP_MODE } from "entities/App";
import { ApplicationVersion } from "@appsmith/actions/applicationActions";

describe("URLBuilder", () => {
  beforeEach(() => {
    urlBuilder.resetURLParams();
  });

  it("should update URL parameters", () => {
    const appParams: ApplicationURLParams = {
      applicationId: "app123",
      applicationSlug: "my-app",
      applicationVersion: ApplicationVersion.SLUG_URL,
    };
    const pageParams: PageURLParams[] = [
      {
        pageId: "page123",
        pageSlug: "my-page",
      },
    ];

    URLBuilder.prototype.updateURLParams(appParams, pageParams);

    expect(urlBuilder.appParams).toEqual(appParams);
    expect(urlBuilder.pageParams["page123"]).toEqual(pageParams[0]);
  });

  it("should reset URL parameters", () => {
    URLBuilder.prototype.resetURLParams();

    expect(urlBuilder.appParams).toEqual({
      applicationId: "",
      applicationSlug: "",
    });
    expect(urlBuilder.pageParams).toEqual({});
  });

  it("should get URL parameters for a page", () => {
    const pageId = "page123";
    const pageParams: PageURLParams = {
      pageId,
      pageSlug: "my-page",
    };
    urlBuilder.pageParams[pageId] = pageParams;

    const result = URLBuilder.prototype.getURLParams(pageId);
    expect(result).toEqual({ ...urlBuilder.appParams, ...pageParams });
  });

  it("should generate base path for an app", () => {
    const pageId = "page123";
    const mode = APP_MODE.EDIT;
    urlBuilder.appParams.applicationVersion = ApplicationVersion.SLUG_URL;
    urlBuilder.pageParams[pageId] = { pageId, pageSlug: "my-page" };

    const result = URLBuilder.prototype.generateBasePath(pageId, mode);
    expect(result).toContain("my-page-");
  });

  it("should get custom slug path preview", () => {
    const pageId = "page123";
    const customSlug = "custom-slug";

    const result = URLBuilder.prototype.getCustomSlugPathPreview(
      pageId,
      customSlug,
    );
    expect(result).toContain("custom-slug-");
  });

  it("should get page path preview", () => {
    const pageId = "page123";
    const pageName = "my-page";
    urlBuilder.appParams.applicationVersion = ApplicationVersion.SLUG_URL;

    const result = URLBuilder.prototype.getPagePathPreview(pageId, pageName);
    expect(result).toContain("my-page-");
  });

  it("should resolve entity ID", () => {
    const builderParams: URLBuilderParams = {
      pageId: "page123",
    };

    const result = URLBuilder.prototype.resolveEntityId(builderParams);
    expect(result).toBe("page123");
  });

  it("should build a URL", () => {
    const builderParams: URLBuilderParams = {
      pageId: "page123",
      params: { test: "value" },
    };

    const result = URLBuilder.prototype.build(builderParams, APP_MODE.EDIT);
    expect(result).toContain("test=value");
  });
});
