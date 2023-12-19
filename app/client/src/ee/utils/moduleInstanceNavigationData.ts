export * from "ce/utils/moduleInstanceNavigationData";
import { moduleInstanceEditorURL } from "@appsmith/RouteBuilder";
import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";
import type { ModuleInstance } from "@appsmith/constants/ModuleInstanceConstants";
import type { JSCollectionData } from "@appsmith/reducers/entityReducers/jsActionsReducer";
import type { ModuleInstanceEntitiesReducerState } from "@appsmith/reducers/entityReducers/moduleInstanceEntitiesReducer";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import keyBy from "lodash/keyBy";
import type {
  EntityNavigationData,
  NavigationData,
} from "selectors/navigationSelectors";
import { createNavData } from "utils/NavigationSelector/common";

export const getModuleInstanceNavigationData = (
  moduleInstances: Record<string, ModuleInstance>,
  moduleInstanceEntities: ModuleInstanceEntitiesReducerState,
): EntityNavigationData => {
  const navigationData: EntityNavigationData = {};
  Object.values(moduleInstances).forEach((instance) => {
    if (instance.type === MODULE_TYPE.QUERY) {
      navigationData[instance.name] = createNavData({
        id: instance.id,
        name: instance.name,
        type: ENTITY_TYPE.MODULE_INSTANCE,
        url: moduleInstanceEditorURL({ moduleInstanceId: instance.id }),
        children: {},
      });
    } else if (instance.type === MODULE_TYPE.JS) {
      const publicJSCollection = moduleInstanceEntities.jsCollections.find(
        (jsCollection) =>
          jsCollection.config.moduleInstanceId === instance.id &&
          jsCollection.config.isPublic,
      );
      let result;
      if (!!publicJSCollection) {
        result = getJSModuleInstanceChildNavigationData(
          instance,
          publicJSCollection,
        );
      }
      navigationData[instance.name] = createNavData({
        id: instance.id,
        name: instance.name,
        type: ENTITY_TYPE.MODULE_INSTANCE,
        url: moduleInstanceEditorURL({ moduleInstanceId: instance.id }),
        children: result?.childNavData || {},
      });
    }
  });
  return navigationData;
};

export const getJSModuleInstanceChildNavigationData = (
  moduleInstance: ModuleInstance,
  publicJSCollection: JSCollectionData,
) => {
  let childNavData: EntityNavigationData = {};

  if (moduleInstance && publicJSCollection) {
    let children: NavigationData[] = publicJSCollection.config.actions.map(
      (jsChild) => {
        return createNavData({
          id: `${moduleInstance.name}.${jsChild.name}`,
          name: `${moduleInstance.name}.${jsChild.name}`,
          type: ENTITY_TYPE.MODULE_INSTANCE,
          isfunction: true, // use this to identify function
          url: moduleInstanceEditorURL({ moduleInstanceId: moduleInstance.id }),
          children: {},
          key: jsChild.name,
        });
      },
    );

    const variableChildren: NavigationData[] =
      publicJSCollection.config.variables.map((jsChild) => {
        return createNavData({
          id: `${moduleInstance.name}.${jsChild.name}`,
          name: `${moduleInstance.name}.${jsChild.name}`,
          type: ENTITY_TYPE.MODULE_INSTANCE,
          isfunction: false,
          url: moduleInstanceEditorURL({ moduleInstanceId: moduleInstance.id }),
          children: {},
          key: jsChild.name,
        });
      });

    children = children.concat(variableChildren);

    childNavData = keyBy(children, (data) => data.key) as Record<
      string,
      NavigationData
    >;

    return { childNavData };
  }
};
