import { generateDataTreeAction } from "entities/DataTree/dataTreeAction";
import { generateDataTreeJSAction } from "entities/DataTree/dataTreeJSAction";
import { generateDataTreeWidget } from "entities/DataTree/dataTreeWidget";
import log from "loglevel";
import {
  ENTITY_TYPE_VALUE,
  EvaluationSubstitutionType,
} from "@appsmith/entities/DataTree/types";
import { generateDataTreeModuleInputs } from "@appsmith/entities/DataTree/utils";
import type {
  DataTreeSeed,
  AppsmithEntity,
  ENTITY_TYPE,
} from "@appsmith/entities/DataTree/types";
import type {
  unEvalAndConfigTree,
  ConfigTree,
  UnEvalTree,
} from "entities/DataTree/dataTreeTypes";
import { isEmpty } from "lodash";

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
    pageList,
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

    dataTree.pageList = pageList;

    dataTree.appsmith = {
      ...appData,
      // combine both persistent and transient state with the transient state
      // taking precedence in case the key is the same
      store: appData.store,
      theme,
    } as AppsmithEntity;
    (dataTree.appsmith as AppsmithEntity).ENTITY_TYPE =
      ENTITY_TYPE_VALUE.APPSMITH;

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
    return { unEvalTree: dataTree, configTree };
  }
}

export { ENTITY_TYPE_VALUE, EvaluationSubstitutionType };
export type { ENTITY_TYPE };
