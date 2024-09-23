import { getQueryEntityItemUrl, getQueryUrl } from "./utils";
import type { FocusEntityInfo } from "navigation/FocusEntity";
import { FocusEntity } from "navigation/FocusEntity";
import { EditorState } from "ee/entities/IDE/constants";
import { PluginPackageName, PluginType } from "entities/Action";
import urlBuilder from "ee/entities/URLRedirect/URLAssembly";

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

describe("getQueryUrl", () => {
  urlBuilder.setCurrentBasePageId("0123456789abcdef00000000");
  it("gets the correct SAAS plugin url", () => {
    const focusEntity: FocusEntityInfo = {
      entity: FocusEntity.QUERY,
      id: "abc",
      appState: EditorState.EDITOR,
      params: {
        pluginPackageName: PluginPackageName.GOOGLE_SHEETS,
        baseApiId: "abc",
      },
    };

    const url = getQueryUrl(focusEntity, false);

    expect(url).toEqual(
      "/app/application/page-0123456789abcdef00000000/edit/saas/google-sheets-plugin/api/abc",
    );

    const addUrl = getQueryUrl(focusEntity);

    expect(addUrl).toEqual(
      "/app/application/page-0123456789abcdef00000000/edit/saas/google-sheets-plugin/api/abc/add",
    );
  });

  it("gets the correct API plugin url", () => {
    const focusEntity: FocusEntityInfo = {
      entity: FocusEntity.QUERY,
      id: "abc",
      appState: EditorState.EDITOR,
      params: {
        baseApiId: "abc",
      },
    };

    const url = getQueryUrl(focusEntity, false);

    expect(url).toEqual(
      "/app/application/page-0123456789abcdef00000000/edit/api/abc",
    );

    const addUrl = getQueryUrl(focusEntity);

    expect(addUrl).toEqual(
      "/app/application/page-0123456789abcdef00000000/edit/api/abc/add",
    );
  });

  it("gets the correct Query Plugin url", () => {
    const focusEntity: FocusEntityInfo = {
      entity: FocusEntity.QUERY,
      id: "abc",
      appState: EditorState.EDITOR,
      params: {
        baseQueryId: "abc",
      },
    };

    const url = getQueryUrl(focusEntity, false);

    expect(url).toEqual(
      "/app/application/page-0123456789abcdef00000000/edit/queries/abc",
    );

    const addUrl = getQueryUrl(focusEntity);

    expect(addUrl).toEqual(
      "/app/application/page-0123456789abcdef00000000/edit/queries/abc/add",
    );
  });

  it("Returns the query list url if is query add state", () => {
    const focusEntity: FocusEntityInfo = {
      entity: FocusEntity.QUERY,
      id: "add",
      appState: EditorState.EDITOR,
      params: {
        baseQueryId: "add",
      },
    };

    const url = getQueryUrl(focusEntity);

    expect(url).toEqual(
      "/app/application/page-0123456789abcdef00000000/edit/queries",
    );
  });

  it("returns query url even if the focus is on another entity type", () => {
    const focusEntity: FocusEntityInfo = {
      entity: FocusEntity.JS_OBJECT,
      id: "abc",
      appState: EditorState.EDITOR,
      params: {
        baseCollectionId: "abc",
      },
    };

    const url = getQueryUrl(focusEntity, false);

    expect(url).toEqual(
      "/app/application/page-0123456789abcdef00000000/edit/queries",
    );

    const addUrl = getQueryUrl(focusEntity);

    expect(addUrl).toEqual(
      "/app/application/page-0123456789abcdef00000000/edit/queries/add",
    );
  });
});
