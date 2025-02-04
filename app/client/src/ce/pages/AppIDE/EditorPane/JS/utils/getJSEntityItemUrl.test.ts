import { getJSEntityItemUrl } from "./getJSEntityItemUrl";
import urlBuilder from "ee/entities/URLRedirect/URLAssembly";
import { PluginType } from "entities/Plugin";

describe("getJSEntityItemUrl", () => {
  urlBuilder.setCurrentBasePageId("0123456789abcdef00000000");
  it("returns a JS url", () => {
    const url = getJSEntityItemUrl(
      {
        title: "TestTitle",
        key: "abc",
        type: PluginType.JS,
      },
      "0123456789abcdef00000000",
    );

    expect(url).toEqual(
      "/app/application/page-0123456789abcdef00000000/edit/jsObjects/abc",
    );
  });
});
