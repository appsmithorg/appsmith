import { getQueryEntityItemUrl } from "./getQueryEntityItemUrl";
import { PluginType } from "entities/Plugin";

describe("getQueryEntityItemUrl", () => {
  it("throws error if plugin type is not a query", () => {
    const item = {
      title: "testTitle",
      type: PluginType.JS,
      key: "abc",
    };

    expect(() => getQueryEntityItemUrl(item, "")).toThrow();
  });

  it("returns url for a query type plugin", () => {
    const item = {
      title: "testTitle",
      type: PluginType.INTERNAL,
      key: "abc",
    };

    expect(getQueryEntityItemUrl(item, "0123456789abcdef00000000")).toEqual(
      "/app/application/page-0123456789abcdef00000000/edit/queries/abc",
    );
  });
});
