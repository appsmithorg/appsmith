import type { DataTree } from "entities/DataTree/dataTreeFactory";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { keyBy } from "lodash";
import type { JSCollectionData } from "reducers/entityReducers/jsActionsReducer";
import { jsCollectionIdURL } from "RouteBuilder";
import type {
  EntityNavigationData,
  NavigationData,
} from "selectors/navigationSelectors";
import { createNavData } from "./common";
import type { JSActionEntity } from "entities/DataTree/types";

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
        type: ENTITY_TYPE.JSACTION,
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
          type: ENTITY_TYPE.JSACTION,
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
