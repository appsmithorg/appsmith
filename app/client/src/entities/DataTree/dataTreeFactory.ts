import { generateDataTreeAction } from "entities/DataTree/dataTreeAction";
import { generateDataTreeJSAction } from "entities/DataTree/dataTreeJSAction";
import { generateDataTreeWidget } from "entities/DataTree/dataTreeWidget";
import log from "loglevel";
import {
  ENTITY_TYPE,
  EvaluationSubstitutionType,
} from "@appsmith/entities/DataTree/types";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { AppPositioningTypes } from "reducers/entityReducers/pageListReducer";
import { Positioning } from "layoutSystems/autolayout/utils/constants";
import { generateDataTreeModuleInputs } from "@appsmith/entities/DataTree/utils";
import type {
  DataTreeSeed,
  unEvalAndConfigTree,
  ConfigTree,
  AppsmithEntity,
} from "@appsmith/entities/DataTree/types";

export class DataTreeFactory {
  static create({
    actions,
    appData,
    editorConfigs,
    isMobile,
    jsActions,
    metaWidgets,
    moduleInputs,
    pageList,
    pluginDependencyConfig,
    theme,
    widgets,
    widgetsMeta,
  }: DataTreeSeed): unEvalAndConfigTree {
    const dataTree: any = {};
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

    generateDataTreeModuleInputs(moduleInputs);

    Object.values(widgets).forEach((widget) => {
      const { configEntity, unEvalEntity } = generateDataTreeWidget(
        widget,
        widgetsMeta[widget.metaWidgetId || widget.widgetId],
      );

      dataTree[widget.widgetName] = unEvalEntity;
      if (
        widgets[MAIN_CONTAINER_WIDGET_ID].positioning === Positioning.Vertical
      ) {
        dataTree[widget.widgetName].appPositioningType =
          AppPositioningTypes.AUTO;
      }
      dataTree[widget.widgetName].isMobile = isMobile;
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
    (dataTree.appsmith as AppsmithEntity).ENTITY_TYPE = ENTITY_TYPE.APPSMITH;

    const startMetaWidgets = performance.now();

    Object.values(metaWidgets).forEach((widget) => {
      const { configEntity, unEvalEntity } = generateDataTreeWidget(
        widget,
        widgetsMeta[widget.metaWidgetId || widget.widgetId],
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

export { ENTITY_TYPE, EvaluationSubstitutionType };
