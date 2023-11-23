import type { JSActionEntity } from "@appsmith/entities/DataTree/types";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { ENTITY_TYPE_VALUE } from "entities/DataTree/dataTreeFactory";
import { keyBy } from "lodash";
import type { JSCollectionData } from "reducers/entityReducers/jsActionsReducer";
import { jsCollectionIdURL } from "@appsmith/RouteBuilder";
import type {
  EntityNavigationData,
  NavigationData,
} from "selectors/navigationSelectors";
import { createNavData } from "./common";

export const getJsChildrenNavData = (
  jsAction: JSCollectionData,
  pageId: string,
  dataTree: DataTree,
) => {
  let childNavData: EntityNavigationData = {};

  const dataTreeAction = dataTree[jsAction.config.name] as JSActionEntity;

  if (dataTreeAction) {
    let children: NavigationData[] = jsAction.config.actions.map((jsChild) => {
      return createNavData({
        id: `${jsAction.config.name}.${jsChild.name}`,
        name: `${jsAction.config.name}.${jsChild.name}`,
        type: ENTITY_TYPE_VALUE.JSACTION,
        isfunction: true, // use this to identify function
        url: jsCollectionIdURL({
          pageId,
          collectionId: jsAction.config.id,
          functionName: jsChild.name,
        }),
        children: {},
        key: jsChild.name,
      });
    });

    const variableChildren: NavigationData[] = jsAction.config.variables.map(
      (jsChild) => {
        return createNavData({
          id: `${jsAction.config.name}.${jsChild.name}`,
          name: `${jsAction.config.name}.${jsChild.name}`,
          type: ENTITY_TYPE_VALUE.JSACTION,
          isfunction: false,
          url: jsCollectionIdURL({
            pageId,
            collectionId: jsAction.config.id,
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
