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
  const peekData: Record<string, unknown> = {};
  let childNavData: EntityNavigationData = {};

  const dataTreeAction = dataTree[jsAction.config.name] as JSActionEntity;

  if (dataTreeAction) {
    let children: NavigationData[] = jsAction.config.actions.map((jsChild) => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      peekData[jsChild.name] = function () {}; // can use new Function to parse string

      const children: EntityNavigationData = {};
      if (jsAction.data?.[jsChild.id] && jsChild.executeOnLoad) {
        (peekData[jsChild.name] as any).data = jsAction.data[jsChild.id];
        children.data = createNavData({
          id: `${jsAction.config.name}.${jsChild.name}.data`,
          name: `${jsAction.config.name}.${jsChild.name}.data`,
          type: ENTITY_TYPE.JSACTION,
          url: undefined,
          peekable: true,
          peekData: undefined,
          children: {},
          key: jsChild.name + ".data",
        });
      }

      return createNavData({
        id: `${jsAction.config.name}.${jsChild.name}`,
        name: `${jsAction.config.name}.${jsChild.name}`,
        type: ENTITY_TYPE.JSACTION,
        url: jsCollectionIdURL({
          pageId,
          collectionId: jsAction.config.id,
          functionName: jsChild.name,
        }),
        peekable: true,
        peekData: undefined,
        children,
        key: jsChild.name,
      });
    });

    const variableChildren: NavigationData[] = jsAction.config.variables.map(
      (jsChild) => {
        if (dataTreeAction)
          peekData[jsChild.name] = dataTreeAction[jsChild.name];
        return createNavData({
          id: `${jsAction.config.name}.${jsChild.name}`,
          name: `${jsAction.config.name}.${jsChild.name}`,
          type: ENTITY_TYPE.JSACTION,
          url: jsCollectionIdURL({
            pageId,
            collectionId: jsAction.config.id,
            functionName: jsChild.name,
          }),
          peekable: true,
          peekData: undefined,
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

    return { childNavData, peekData };
  }
};
