import urlBuilder, { EDITOR_TYPE } from "./URLAssembly";
import { APP_MODE } from "entities/App";
import { PLACEHOLDER_APP_SLUG, PLACEHOLDER_PAGE_SLUG } from "constants/routes";
import type { URLBuilderParams } from "./URLAssembly";

describe("URLAssembly", () => {
  let originalLocation: typeof window.location;

  function mockPathname(pathname: string) {
    Object.defineProperty(window, "location", {
      value: {
        pathname,
        search: "",
      },
      writable: true,
    });
  }

  beforeEach(() => {
    // Store the original location object
    originalLocation = window.location;

    urlBuilder.setModulesParams(() => ({}));
    urlBuilder.setPackageParams({});
    urlBuilder.setCurrentModuleId(null);
  });

  afterEach(() => {
    // Restore the original location object after the test
    window.location = originalLocation;

    jest.clearAllMocks();
  });

  it("should return the default editor type as pkg for package route", () => {
    mockPathname("/pkg/package-id/module-id");

    const editorType = urlBuilder.getDefaultEditorType();

    expect(editorType).toBe(EDITOR_TYPE.PKG);
  });

  it("should return the default editor type as workflow for workflows route", () => {
    mockPathname("/workflow/workflow-id");

    const editorType = urlBuilder.getDefaultEditorType();

    expect(editorType).toBe(EDITOR_TYPE.WORKFLOW);
  });

  it("should return the default editor type as app for app route", () => {
    mockPathname("/app/app-id/app-id");
    const editorType = urlBuilder.getDefaultEditorType();

    expect(editorType).toBe(EDITOR_TYPE.APP);
  });

  it("should return the default editor type as app for unknown route", () => {
    mockPathname("/unknown-editor/package-id/module-id");
    const editorType = urlBuilder.getDefaultEditorType();

    expect(editorType).toBe(EDITOR_TYPE.APP);
  });

  it("should generate the base path for PKG editor type", () => {
    mockPathname(`/pkg/package456/module-id/edit`);

    const moduleId = "someModuleId";

    urlBuilder.setPackageParams({
      packageId: "package456",
      packageSlug: "",
    });

    urlBuilder.setModulesParams(() => ({
      "module-id": {
        moduleId: "module-id",
        moduleSlug: "",
      },
      [moduleId]: {
        moduleId,
        moduleSlug: "",
      },
    }));

    const mode = APP_MODE.EDIT;

    const basePath = urlBuilder.generateBasePath(moduleId, mode);

    expect(basePath).toBe(`/pkg/package456/${moduleId}/edit`);
  });

  it("should generate the base path for APP editor type", () => {
    mockPathname("/app/app-id/page-id/edit");

    const entityId = "someEntityId";
    const mode = APP_MODE.EDIT;
    const basePath = urlBuilder.generateBasePath(entityId, mode);

    expect(basePath).toBe(
      `/app/${PLACEHOLDER_APP_SLUG}/${PLACEHOLDER_PAGE_SLUG}-${entityId}/edit`,
    );
  });

  it("should resolve entity ID for PKG editor type", () => {
    mockPathname("/pkg/package456/module-id/edit");

    const builderParams: URLBuilderParams = { moduleId: "someModuleId" };
    const entityId = urlBuilder.resolveEntityId(builderParams);

    expect(entityId).toBe("someModuleId");
  });

  it("should resolve entity ID for APP editor type", () => {
    mockPathname("/app/app-id/page-id/edit");

    const builderParams: URLBuilderParams = { pageId: "somePageId" };
    const entityId = urlBuilder.resolveEntityId(builderParams);

    expect(entityId).toBe("somePageId");
  });

  it("should build a URL by checking the currentModuleId", () => {
    mockPathname(`/pkg/package456/module123/edit`);

    urlBuilder.setPackageParams({
      packageId: "package456",
      packageSlug: "",
    });

    urlBuilder.setModulesParams(() => ({
      "module-id": {
        moduleId: "module-id",
        moduleSlug: "",
      },
      module123: {
        moduleId: "module123",
        moduleSlug: "",
      },
    }));

    urlBuilder.setCurrentModuleId("module123");

    const mode = APP_MODE.EDIT;
    const url = urlBuilder.build({}, mode);

    expect(url).toBe("/pkg/package456/module123/edit");
  });

  it("should build a URL by using the moduleId passed as builderParams", () => {
    const moduleId = "someModuleId";
    mockPathname(`/pkg/package456/module123/edit`);

    urlBuilder.setPackageParams({
      packageId: "package456",
      packageSlug: "",
    });

    urlBuilder.setModulesParams(() => ({
      [moduleId]: {
        moduleId,
        moduleSlug: "",
      },
      module123: {
        moduleId: "module123",
        moduleSlug: "",
      },
    }));

    urlBuilder.setCurrentModuleId("module123");

    const builderParams: URLBuilderParams = {
      moduleId,
    };

    const mode = APP_MODE.EDIT;
    const url = urlBuilder.build(builderParams, mode);

    expect(url).toBe(`/pkg/package456/${moduleId}/edit`);
  });

  it("should return an empty string when packageParams is empty", () => {
    mockPathname(`/pkg/package456`);

    const basePath = urlBuilder.generateBasePathForPkg();
    expect(basePath).toBe("");
  });

  it("should return editor path when moduleParams is empty", () => {
    mockPathname(`/pkg/package456`);

    urlBuilder.setPackageParams({
      packageId: "package456",
      packageSlug: "",
    });

    const basePath = urlBuilder.generateBasePathForPkg();
    expect(basePath).toBe("/pkg/package456");
  });

  it("should return editor path when generateEditorPath is true", () => {
    mockPathname(`/pkg/package456/module-id/edit`);

    urlBuilder.setPackageParams({
      packageId: "package456",
      packageSlug: "",
    });

    const path = urlBuilder.build({ generateEditorPath: true });
    expect(path).toBe("/pkg/package456");
  });

  it("should return module path when generateEditorPath is false", () => {
    const moduleId = "new-module";
    mockPathname(`/pkg/package456/module123/edit`);

    urlBuilder.setPackageParams({
      packageId: "package456",
      packageSlug: "",
    });

    urlBuilder.setModulesParams(() => ({
      [moduleId]: {
        moduleId,
        moduleSlug: "",
      },
      module123: {
        moduleId: "module123",
        moduleSlug: "",
      },
    }));

    urlBuilder.setCurrentModuleId("module123");

    const path = urlBuilder.build({
      generateEditorPath: false,
      moduleId: "new-module",
    });
    expect(path).toBe(`/pkg/package456/${moduleId}/edit`);
  });
});
