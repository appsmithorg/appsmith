import {
  buildCreatePageRequest,
  buildDeletePageRequest,
  buildRenamePageRequest,
  createPageSpecSchema,
  deletePageSpecSchema,
  renamePageSpecSchema,
} from "./pages.js";

const applicationId = "a".repeat(24);
const pageId = "b".repeat(24);
const revision = "c".repeat(64);

describe("page CRUD request builders", () => {
  it("builds a create request with only a compiler-owned blank layout", () => {
    const request = buildCreatePageRequest(
      createPageSpecSchema.parse({
        applicationId,
        revision,
        name: "Orders",
      }),
    );

    expect(request).toEqual({
      applicationId,
      revision,
      method: "POST",
      path: "v1/pages",
      body: {
        applicationId,
        name: "Orders",
        layouts: [
          {
            dsl: {
              widgetName: "MainContainer",
              backgroundColor: "none",
              rightColumn: 1242,
              snapColumns: 64,
              widgetId: "0",
              topRow: 0,
              bottomRow: 1292,
              parentRowSpace: 1,
              type: "CANVAS_WIDGET",
              detachFromLayout: true,
              minHeight: 1292,
              dynamicBindingPathList: {},
              parentColumnSpace: 1,
              leftColumn: 0,
              children: [],
            },
            layoutOnLoadActions: [],
          },
        ],
      },
      destructive: false,
    });
  });

  it("builds a minimal rename request", () => {
    expect(
      buildRenamePageRequest(
        renamePageSpecSchema.parse({
          applicationId,
          pageId,
          revision,
          name: "Orders Archive",
        }),
      ),
    ).toEqual({
      applicationId,
      revision,
      method: "PUT",
      path: `v1/pages/${pageId}`,
      body: { name: "Orders Archive" },
      destructive: false,
    });
  });

  it("marks deletion as destructive and binds its confirmation to the page", () => {
    expect(
      buildDeletePageRequest(
        deletePageSpecSchema.parse({ applicationId, pageId, revision }),
      ),
    ).toEqual({
      applicationId,
      pageId,
      revision,
      method: "DELETE",
      path: `v1/pages/${pageId}`,
      destructive: true,
      confirmation: {
        operation: "delete_page",
        entityKey: `page:${pageId}`,
      },
    });
  });
});

describe("page CRUD schemas reject unsafe mutation input", () => {
  const invalidCreate: [string, Record<string, unknown>][] = [
    ["missing revision", { revision: undefined }],
    ["raw DSL", { dsl: { widgetName: "Injected" } }],
    ["arbitrary page config", { isHidden: true }],
    ["JavaScript binding", { name: "{{ evil.run() }}" }],
    ["template interpolation", { name: "${evil}" }],
    ["unsafe filename", { name: "../admin" }],
    ["empty name", { name: "   " }],
    ["invalid application ID", { applicationId: "app1" }],
  ];

  it.each(invalidCreate)("rejects create input with %s", (_label, override) => {
    expect(
      createPageSpecSchema.safeParse({
        applicationId,
        revision,
        name: "Orders",
        ...override,
      }).success,
    ).toBe(false);
  });

  it.each([
    ["raw DSL", { layouts: [] }],
    ["arbitrary page config", { customSlug: "orders" }],
    ["binding name", { name: "{{ evil }}" }],
    ["unsafe name", { name: "Orders/Archive" }],
    ["missing revision", { revision: undefined }],
  ])("rejects rename input with %s", (_label, override) => {
    expect(
      renamePageSpecSchema.safeParse({
        applicationId,
        pageId,
        revision,
        name: "Orders",
        ...override,
      }).success,
    ).toBe(false);
  });

  it("rejects delete input without a revision or with caller-controlled fields", () => {
    expect(
      deletePageSpecSchema.safeParse({ applicationId, pageId }).success,
    ).toBe(false);
    expect(
      deletePageSpecSchema.safeParse({
        applicationId,
        pageId,
        revision,
        force: true,
      }).success,
    ).toBe(false);
  });
});
