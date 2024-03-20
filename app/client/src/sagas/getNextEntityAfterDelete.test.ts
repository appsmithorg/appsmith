import { EditorState, type EntityItem } from "@appsmith/entities/IDE/constants";
import { PluginType } from "entities/Action";
import * as FocusEntityObj from "navigation/FocusEntity";
import { RedirectAction, getNextEntityAfterDelete } from "./IDESaga";
import { FocusEntity } from "navigation/FocusEntity";

/**
 *
 * @return action   -> RedirectAction.NA if the deleted item is not current one
 * @return action   -> RedirectAction.CREATE if no items left in the list
 * @return action   -> RedirectAction.ITEM if there is no item left in the same group
 *         payload  -> first item from the all items list
 * @return action   -> RedirectAction.ITEM if there is there are items left in the same group
 *         payload  -> first item from the grouped list
 *
 */
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
    expect(getNextEntityAfterDelete("5", [])).toEqual({
      action: RedirectAction.NA,
    });
  });

  it("2. Redirect to add, if nothing left after deletion", () => {
    expect(getNextEntityAfterDelete("2", [])).toEqual({
      action: RedirectAction.CREATE,
    });
  });

  it("3. Redirect to the first item, if nothing left in the same group", () => {
    expect(getNextEntityAfterDelete("2", items)).toEqual({
      action: RedirectAction.ITEM,
      payload: items[0],
    });
  });

  it("4. Redirect to the first item in the group", () => {
    items.push({
      title: "Google sheet 2",
      type: PluginType.SAAS,
      key: "3",
      group: "AbGsheet",
    });
    expect(getNextEntityAfterDelete("2", items)).toEqual({
      action: RedirectAction.ITEM,
      payload: items[2],
    });
  });
});
