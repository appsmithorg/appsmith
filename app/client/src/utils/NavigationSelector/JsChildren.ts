import {
  DataTree,
  DataTreeJSAction,
  ENTITY_TYPE,
} from "entities/DataTree/dataTreeFactory";
import { keyBy } from "lodash";
import { JSCollectionData } from "reducers/entityReducers/jsActionsReducer";
import { jsCollectionIdURL } from "RouteBuilder";
import {
  EntityNavigationData,
  NavigationData,
} from "selectors/navigationSelectors";
import { createNavData } from "./common";

export const getJsChildrenNavData = (
  jsAction: JSCollectionData,
  pageId: string,
  dataTree: DataTree,
) => {
  const peekData: Record<string, unknown> = {};
  let childNavData: EntityNavigationData = {};

  const dataTreeAction = dataTree[jsAction.config.name] as DataTreeJSAction;

  if (dataTreeAction) {
    let children: NavigationData[] = jsAction.config.actions.map((jsChild) => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      peekData[jsChild.name] = function() {}; // can use new Function to parse string

      const children: EntityNavigationData = {};
      if (jsAction.data?.[jsChild.id] && jsChild.executeOnLoad) {
        (peekData[jsChild.name] as any).data = jsAction.data[jsChild.id];
        children.data = createNavData(
          `${jsAction.config.name}.${jsChild.name}.data`,
          `${jsAction.config.name}.${jsChild.name}.data`,
          ENTITY_TYPE.JSACTION,
          false,
          undefined,
          true,
          undefined,
          {},
          jsChild.name + ".data",
        );
      }

      return createNavData(
        `${jsAction.config.name}.${jsChild.name}`,
        `${jsAction.config.name}.${jsChild.name}`,
        ENTITY_TYPE.JSACTION,
        true,
        jsCollectionIdURL({
          pageId,
          collectionId: jsAction.config.id,
          functionName: jsChild.name,
        }),
        true,
        undefined,
        children,
        jsChild.name,
      );
    });

    const variableChildren: NavigationData[] = jsAction.config.variables.map(
      (jsChild) => {
        if (dataTreeAction)
          peekData[jsChild.name] = dataTreeAction[jsChild.name];
        return createNavData(
          `${jsAction.config.name}.${jsChild.name}`,
          `${jsAction.config.name}.${jsChild.name}`,
          ENTITY_TYPE.JSACTION,
          true,
          jsCollectionIdURL({
            pageId,
            collectionId: jsAction.config.id,
            functionName: jsChild.name,
          }),
          true,
          undefined,
          {},
          jsChild.name,
        );
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
