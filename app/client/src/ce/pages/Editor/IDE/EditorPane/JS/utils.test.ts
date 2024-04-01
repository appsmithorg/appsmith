import { getJSEntityItemUrl, getJSUrl } from "./utils";
import urlBuilder from "@appsmith/entities/URLRedirect/URLAssembly";
import { PluginType } from "entities/Action";
import type { FocusEntityInfo } from "navigation/FocusEntity";
import { FocusEntity } from "navigation/FocusEntity";
import { EditorState } from "@appsmith/entities/IDE/constants";

describe("getJSEntityItemUrl", () => {
  urlBuilder.setCurrentPageId("testPage");
  it("returns a JS url", () => {
    const url = getJSEntityItemUrl(
      {
        title: "TestTitle",
        key: "abc",
        type: PluginType.JS,
      },
      "testPage",
    );

    expect(url).toEqual("/app/application/page-testPage/edit/jsObjects/abc");
  });
});

describe("getJSUrl", () => {
  urlBuilder.setCurrentPageId("testPage");
  it("returns a JS collection url", () => {
    const focusEntity: FocusEntityInfo = {
      entity: FocusEntity.JS_OBJECT,
      id: "abc",
      appState: EditorState.EDITOR,
      params: {},
    };
    const url = getJSUrl(focusEntity, false);
    expect(url).toEqual("/app/application/page-testPage/edit/jsObjects/abc");

    const addUrl = getJSUrl(focusEntity);
    expect(addUrl).toEqual(
      "/app/application/page-testPage/edit/jsObjects/abc/add",
    );
  });

  it("if focus is on add, it will return the list url", () => {
    const focusEntity: FocusEntityInfo = {
      entity: FocusEntity.JS_OBJECT_ADD,
      id: "abc",
      appState: EditorState.EDITOR,
      params: {},
    };
    const url = getJSUrl(focusEntity, false);
    expect(url).toEqual("/app/application/page-testPage/edit/jsObjects");
  });

  it("returns the js url even if the focus is not on JS", () => {
    const focusEntity: FocusEntityInfo = {
      entity: FocusEntity.QUERY,
      id: "abc",
      appState: EditorState.EDITOR,
      params: {
        queryId: "abc",
        pageId: "testPage",
      },
    };
    const url = getJSUrl(focusEntity, false);
    expect(url).toEqual("/app/application/page-testPage/edit/jsObjects");

    const addUrl = getJSUrl(focusEntity);
    expect(addUrl).toEqual("/app/application/page-testPage/edit/jsObjects/add");
  });
});
