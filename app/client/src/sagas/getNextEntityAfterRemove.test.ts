import { EditorState, type EntityItem } from "@appsmith/entities/IDE/constants";
import { PluginType } from "entities/Action";
import * as FocusEntityObj from "navigation/FocusEntity";
import { RedirectAction, getNextEntityAfterRemove } from "./IDESaga";
import { FocusEntity } from "navigation/FocusEntity";

describe("getNextEntityAfterDelete function", () => {
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

  it("1. Deleted item is not the current item then no redirect", () => {
    expect(getNextEntityAfterRemove("5", [], [])).toEqual({
      action: RedirectAction.NA,
    });
  });

  it("2. Redirect to add, if nothing left after deletion", () => {
    expect(getNextEntityAfterRemove("2", [], [])).toEqual({
      action: RedirectAction.LIST,
    });
  });

  it("3. Redirect to the first item, if nothing left in the tabs", () => {
    expect(getNextEntityAfterRemove("2", items, ["2"])).toEqual({
      action: RedirectAction.ITEM,
      payload: items[0],
    });
  });

  it("4. Redirect to the previous item if current tab is not the first one", () => {
    expect(getNextEntityAfterRemove("2", items, ["1", "2"])).toEqual({
      action: RedirectAction.ITEM,
      payload: items[0],
    });
  });

  it("5. Redirect to the next item if current tab is the first one", () => {
    expect(getNextEntityAfterRemove("2", items, ["2", "1"])).toEqual({
      action: RedirectAction.ITEM,
      payload: items[0],
    });
  });
});
