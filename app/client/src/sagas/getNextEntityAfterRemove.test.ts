import { EditorState } from "IDE/enums";
import { PluginType } from "entities/Plugin";
import * as FocusEntityObj from "navigation/FocusEntity";
import { RedirectAction, getNextEntityAfterRemove } from "./helper";
import { FocusEntity } from "navigation/FocusEntity";
import type { EntityItem } from "ee/IDE/Interfaces/EntityItem";

describe("getNextEntityAfterRemove function", () => {
  const items: EntityItem[] = [
    {
      title: "API 1",
      type: PluginType.API,
      key: "1",
      group: "Users",
    },
    {
      title: "Google sheet 1",
      type: PluginType.SAAS,
      key: "2",
      group: "AbGsheet",
    },
  ];

  jest
    .spyOn(FocusEntityObj, "identifyEntityFromPath")
    .mockImplementation(() => ({
      entity: FocusEntity.QUERY,
      id: "2",
      appState: EditorState.EDITOR,
      params: {},
    }));

  it("1. Removed item is not the current item then no redirect", () => {
    expect(getNextEntityAfterRemove("5", items)).toEqual({
      action: RedirectAction.NA,
    });
  });

  it("2. Redirect to add, if nothing left after deletion", () => {
    expect(getNextEntityAfterRemove("2", [])).toEqual({
      action: RedirectAction.LIST,
    });
  });

  it("3. Redirect to the previous item if current tab is not the first one", () => {
    expect(getNextEntityAfterRemove("2", items)).toEqual({
      action: RedirectAction.ITEM,
      payload: items[0],
    });
  });

  it("4. Redirect to the next item if current tab is the first one", () => {
    expect(getNextEntityAfterRemove("2", items.reverse())).toEqual({
      action: RedirectAction.ITEM,
      payload: items[1],
    });
  });
});
