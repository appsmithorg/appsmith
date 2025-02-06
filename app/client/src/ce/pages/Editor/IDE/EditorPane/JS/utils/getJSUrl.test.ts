import { getJSUrl } from "./getJSUrl";
import urlBuilder from "ee/entities/URLRedirect/URLAssembly";
import type { FocusEntityInfo } from "navigation/FocusEntity";
import { FocusEntity } from "navigation/FocusEntity";
import { EditorState } from "IDE/Interfaces/EditorState";

describe("getJSUrl", () => {
  urlBuilder.setCurrentBasePageId("0123456789abcdef00000000");
  it("returns a JS collection url", () => {
    const focusEntity: FocusEntityInfo = {
      entity: FocusEntity.JS_OBJECT,
      id: "abc",
      appState: EditorState.EDITOR,
      params: {},
    };
    const url = getJSUrl(focusEntity, false);

    expect(url).toEqual(
      "/app/application/page-0123456789abcdef00000000/edit/jsObjects/abc",
    );

    const addUrl = getJSUrl(focusEntity);

    expect(addUrl).toEqual(
      "/app/application/page-0123456789abcdef00000000/edit/jsObjects/abc/add",
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

    expect(url).toEqual(
      "/app/application/page-0123456789abcdef00000000/edit/jsObjects",
    );
  });

  it("returns the js url even if the focus is not on JS", () => {
    const focusEntity: FocusEntityInfo = {
      entity: FocusEntity.QUERY,
      id: "abc",
      appState: EditorState.EDITOR,
      params: {
        baseQueryId: "abc",
        basePageId: "0123456789abcdef00000000",
      },
    };
    const url = getJSUrl(focusEntity, false);

    expect(url).toEqual(
      "/app/application/page-0123456789abcdef00000000/edit/jsObjects",
    );

    const addUrl = getJSUrl(focusEntity);

    expect(addUrl).toEqual(
      "/app/application/page-0123456789abcdef00000000/edit/jsObjects/add",
    );
  });
});
