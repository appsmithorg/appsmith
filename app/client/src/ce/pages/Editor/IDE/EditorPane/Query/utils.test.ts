import { getQueryEntityItemUrl, getQueryUrl } from "./utils";
import type { FocusEntityInfo } from "navigation/FocusEntity";
import { FocusEntity } from "navigation/FocusEntity";
import { EditorState } from "@appsmith/entities/IDE/constants";
import { PluginPackageName, PluginType } from "entities/Action";
import urlBuilder from "@appsmith/entities/URLRedirect/URLAssembly";

describe("getQueryEntityItemUrl", () => {
  it("throws error if plugin type is not a query", () => {
    const item = {
      title: "testTitle",
      type: PluginType.JS,
      key: "abc",
    };

    expect(() => getQueryEntityItemUrl(item, "testPage")).toThrow();
  });

  it("returns url for a query type plugin", () => {
    const item = {
      title: "testTitle",
      type: PluginType.INTERNAL,
      key: "abc",
    };

    expect(getQueryEntityItemUrl(item, "testPage")).toEqual(
      "/app/application/page-testPage/edit/queries/abc",
    );
  });
});

describe("getQueryUrl", () => {
  urlBuilder.setCurrentPageId("testPage");
  it("gets the correct SAAS plugin url", () => {
    const focusEntity: FocusEntityInfo = {
      entity: FocusEntity.QUERY,
      id: "abc",
      appState: EditorState.EDITOR,
      params: {
        pluginPackageName: PluginPackageName.GOOGLE_SHEETS,
        apiId: "abc",
      },
    };

    const url = getQueryUrl(focusEntity, false);
    expect(url).toEqual(
      "/app/application/page-testPage/edit/saas/google-sheets-plugin/api/abc",
    );

    const addUrl = getQueryUrl(focusEntity);
    expect(addUrl).toEqual(
      "/app/application/page-testPage/edit/saas/google-sheets-plugin/api/abc/add",
    );
  });

  it("gets the correct API plugin url", () => {
    const focusEntity: FocusEntityInfo = {
      entity: FocusEntity.QUERY,
      id: "abc",
      appState: EditorState.EDITOR,
      params: {
        apiId: "abc",
      },
    };

    const url = getQueryUrl(focusEntity, false);
    expect(url).toEqual("/app/application/page-testPage/edit/api/abc");

    const addUrl = getQueryUrl(focusEntity);
    expect(addUrl).toEqual("/app/application/page-testPage/edit/api/abc/add");
  });

  it("gets the correct Query Plugin url", () => {
    const focusEntity: FocusEntityInfo = {
      entity: FocusEntity.QUERY,
      id: "abc",
      appState: EditorState.EDITOR,
      params: {
        queryId: "abc",
      },
    };

    const url = getQueryUrl(focusEntity, false);
    expect(url).toEqual("/app/application/page-testPage/edit/queries/abc");

    const addUrl = getQueryUrl(focusEntity);
    expect(addUrl).toEqual(
      "/app/application/page-testPage/edit/queries/abc/add",
    );
  });

  it("Returns the query list url if is query add state", () => {
    const focusEntity: FocusEntityInfo = {
      entity: FocusEntity.QUERY,
      id: "add",
      appState: EditorState.EDITOR,
      params: {
        queryId: "add",
      },
    };

    const url = getQueryUrl(focusEntity);
    expect(url).toEqual("/app/application/page-testPage/edit/queries");
  });

  it("returns query url even if the focus is on another entity type", () => {
    const focusEntity: FocusEntityInfo = {
      entity: FocusEntity.JS_OBJECT,
      id: "abc",
      appState: EditorState.EDITOR,
      params: {
        collectionId: "abc",
      },
    };

    const url = getQueryUrl(focusEntity, false);
    expect(url).toEqual("/app/application/page-testPage/edit/queries");

    const addUrl = getQueryUrl(focusEntity);
    expect(addUrl).toEqual("/app/application/page-testPage/edit/queries/add");
  });
});
