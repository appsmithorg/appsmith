import {
  canonicalRemovalNames,
  WIDGET_REMOVAL_OPERATION,
  widgetRemovalBinding,
  widgetRemovalDigest,
  widgetRemovalEntityKey,
} from "./widgetRemoval.js";

const target = {
  applicationId: "app1",
  pageId: "page1",
  layoutId: "layout1",
  names: ["Card1", "Greeting"],
};

describe("APP-16324 F7: the widget-removal approval binding", () => {
  it("binds the actor, the page lock entity, the operation, the revision and a target digest", () => {
    expect(
      widgetRemovalBinding("user@example.com", target, "r".repeat(64)),
    ).toEqual({
      actorId: "user@example.com",
      entityKey: "page:app1:page1",
      operation: WIDGET_REMOVAL_OPERATION,
      revision: "r".repeat(64),
      digest: widgetRemovalDigest(target),
    });
    expect(widgetRemovalEntityKey("app1", "page1")).toBe("page:app1:page1");
  });

  // A token prepared by one tool must not confirm another tool's removal of the same widgets.
  it("binds a caller-chosen operation name", () => {
    const core = widgetRemovalBinding("u", target, "r".repeat(64));
    const other = widgetRemovalBinding(
      "u",
      target,
      "r".repeat(64),
      "remove_sections",
    );

    expect(core.operation).toBe(WIDGET_REMOVAL_OPERATION);
    expect(other.operation).toBe("remove_sections");
    expect(other.digest).toBe(core.digest);
  });

  it("gives the same digest whatever the order or repeats of the names", () => {
    expect(
      widgetRemovalDigest({ ...target, names: ["Greeting", "Card1", "Card1"] }),
    ).toBe(widgetRemovalDigest(target));
    expect(canonicalRemovalNames(["b", "a", "b"])).toEqual(["a", "b"]);
  });

  it.each([
    ["another widget", { names: ["Card1"] }],
    ["another layout", { layoutId: "layout2" }],
    ["another page", { pageId: "page2" }],
    ["another application", { applicationId: "app2" }],
  ])("gives a different digest for %s", (_label, change) => {
    expect(widgetRemovalDigest({ ...target, ...change })).not.toBe(
      widgetRemovalDigest(target),
    );
  });
});
