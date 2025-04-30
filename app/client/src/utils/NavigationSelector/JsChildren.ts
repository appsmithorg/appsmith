import type { JSActionEntity } from "ee/entities/DataTree/types";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { ENTITY_TYPE } from "ee/entities/DataTree/types";
import { keyBy } from "lodash";
import type { JSCollectionData } from "ee/reducers/entityReducers/jsActionsReducer";
import { jsCollectionIdURL } from "ee/RouteBuilder";
import type {
  EntityNavigationData,
  NavigationData,
} from "entities/DataTree/dataTreeTypes";
import { createNavData } from "./common";

export const getJsChildrenNavData = (
  jsAction: JSCollectionData,
  basePageId: string,
  dataTree: DataTree,
) => {
  let childNavData: EntityNavigationData = {};

  const dataTreeAction = dataTree[jsAction.config.name] as JSActionEntity;
  const jsActionVariables = jsAction.config.variables || [];

  if (dataTreeAction) {
    let children: NavigationData[] = jsAction.config.actions.map((jsChild) => {
      return createNavData({
        id: `${jsAction.config.name}.${jsChild.name}`,
        name: `${jsAction.config.name}.${jsChild.name}`,
        type: ENTITY_TYPE.JSACTION,
        isfunction: true, // use this to identify function
        url: jsCollectionIdURL({
          basePageId,
          baseCollectionId: jsAction.config.baseId,
          functionName: jsChild.name,
        }),
        children: {},
        key: jsChild.name,
      });
    });

    const variableChildren: NavigationData[] = jsActionVariables.map(
      (jsChild) => {
        return createNavData({
          id: `${jsAction.config.name}.${jsChild.name}`,
          name: `${jsAction.config.name}.${jsChild.name}`,
          type: ENTITY_TYPE.JSACTION,
          isfunction: false,
          url: jsCollectionIdURL({
            basePageId,
            baseCollectionId: jsAction.config.baseId,
            functionName: jsChild.name,
          }),
          children: {},
          key: jsChild.name,
        });
      },
    );

    children = children.concat(variableChildren);

    childNavData = keyBy(children, (data) => data.key) as Record<
      string,
      NavigationData
    >;

    return { childNavData };
  }
};
