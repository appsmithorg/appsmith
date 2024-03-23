import { generateDataTreeAction } from "@appsmith/entities/DataTree/dataTreeAction";
import { generateDataTreeJSAction } from "@appsmith/entities/DataTree/dataTreeJSAction";
import { generateDataTreeWidget } from "entities/DataTree/dataTreeWidget";
import log from "loglevel";
import {
  ENTITY_TYPE,
  EvaluationSubstitutionType,
} from "@appsmith/entities/DataTree/types";
import { generateDataTreeModuleInputs } from "@appsmith/entities/DataTree/utils";
import type {
  DataTreeSeed,
  AppsmithEntity,
  EntityTypeValue,
} from "@appsmith/entities/DataTree/types";
import type {
  unEvalAndConfigTree,
  ConfigTree,
  UnEvalTree,
} from "entities/DataTree/dataTreeTypes";
import { isEmpty } from "lodash";
import { generateModuleInstance } from "@appsmith/entities/DataTree/dataTreeModuleInstance";
export class DataTreeFactory {
  static create({
    actions,
    appData,
    editorConfigs,
    isMobile,
    jsActions,
    layoutSystemType,
    loadingEntities,
    metaWidgets,
    moduleInputs,
    moduleInstanceEntities,
    moduleInstances,
    pluginDependencyConfig,
    theme,
    widgets,
    widgetsMeta,
  }: DataTreeSeed): unEvalAndConfigTree {
    const dataTree: UnEvalTree = {};
    const configTree: ConfigTree = {};
    const start = performance.now();
    const startActions = performance.now();

    actions.forEach((action) => {
      const editorConfig = editorConfigs[action.config.pluginId];
      const dependencyConfig = pluginDependencyConfig[action.config.pluginId];
      const { configEntity, unEvalEntity } = generateDataTreeAction(
        action,
        editorConfig,
        dependencyConfig,
      );
      dataTree[action.config.name] = unEvalEntity;
      configTree[action.config.name] = configEntity;
    });
    const endActions = performance.now();

    const startJsActions = performance.now();

    jsActions.forEach((js) => {
      const { configEntity, unEvalEntity } = generateDataTreeJSAction(js);
      dataTree[js.config.name] = unEvalEntity;
      configTree[js.config.name] = configEntity;
    });
    const endJsActions = performance.now();

    const startWidgets = performance.now();

    if (!isEmpty(moduleInputs)) {
      const { configEntity, unEvalEntity } =
        generateDataTreeModuleInputs(moduleInputs);
      if (!!configEntity && !!unEvalEntity) {
        dataTree.inputs = unEvalEntity;
        configTree.inputs = configEntity;
      }
    }

    if (!isEmpty(moduleInstances)) {
      Object.values(moduleInstances).forEach((moduleInstance) => {
        const { configEntity, unEvalEntity } = generateModuleInstance(
          moduleInstance,
          moduleInstanceEntities,
        );
        if (!!configEntity && !!unEvalEntity) {
          dataTree[moduleInstance.name] = unEvalEntity;
          configTree[moduleInstance.name] = configEntity;
        }
      });
    }

    Object.values(widgets).forEach((widget) => {
      const { configEntity, unEvalEntity } = generateDataTreeWidget(
        widget,
        widgetsMeta[widget.metaWidgetId || widget.widgetId],
        loadingEntities,
        layoutSystemType,
        isMobile,
      );

      dataTree[widget.widgetName] = unEvalEntity;
      configTree[widget.widgetName] = configEntity;
    });

    const endWidgets = performance.now();

    dataTree.appsmith = {
      ...appData,
      // combine both persistent and transient state with the transient state
      // taking precedence in case the key is the same
      store: appData.store,
      theme,
    } as AppsmithEntity;
    (dataTree.appsmith as AppsmithEntity).ENTITY_TYPE = ENTITY_TYPE.APPSMITH;

    const startMetaWidgets = performance.now();

    Object.values(metaWidgets).forEach((widget) => {
      const { configEntity, unEvalEntity } = generateDataTreeWidget(
        widget,
        widgetsMeta[widget.metaWidgetId || widget.widgetId],
        loadingEntities,
      );
      dataTree[widget.widgetName] = unEvalEntity;
      configTree[widget.widgetName] = configEntity;
    });
    const endMetaWidgets = performance.now();

    const end = performance.now();

    const out = {
      total: end - start,
      widgets: endWidgets - startWidgets,
      actions: endActions - startActions,
      jsActions: endJsActions - startJsActions,
      metaWidgets: endMetaWidgets - startMetaWidgets,
    };

    log.debug("### Create unevalTree timing", out);
    console.log("***", "num nodes is ", countKeyValuePairs(dataTree), dataTree)
    return { unEvalTree: dataTree, configTree };
  }
}

function countKeyValuePairs(obj : any) {
  let count = 0;

  // Iterate over each key in the object
  for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
          // If the value is an array, count its length and recursively count key-value pairs for each element
          if (Array.isArray(obj[key])) {
              count += obj[key].length;
              obj[key].forEach((element : any) => {
                  if (typeof element === 'object' && element !== null) {
                      count += countKeyValuePairs(element);
                  } else {
                      count++;
                  }
              });
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
              // If the value is another object, recursively count its key-value pairs
              count += countKeyValuePairs(obj[key]);
          } else {
              // If the value is neither an object nor an array, increment the count
              count++;
          }
      }
  }

  return count;
}

export { ENTITY_TYPE, EvaluationSubstitutionType };
export type { EntityTypeValue };
