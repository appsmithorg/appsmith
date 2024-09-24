import { generateDataTreeAction } from "ee/entities/DataTree/dataTreeAction";
import { generateDataTreeJSAction } from "ee/entities/DataTree/dataTreeJSAction";
import { generateDataTreeWidget } from "entities/DataTree/dataTreeWidget";
import log from "loglevel";
import {
  ENTITY_TYPE,
  EvaluationSubstitutionType,
} from "ee/entities/DataTree/types";
import { generateDataTreeModuleInputs } from "ee/entities/DataTree/utils";
import type {
  DataTreeSeed,
  AppsmithEntity,
  EntityTypeValue,
} from "ee/entities/DataTree/types";
import type {
  unEvalAndConfigTree,
  ConfigTree,
  UnEvalTree,
} from "entities/DataTree/dataTreeTypes";
import { isEmpty } from "lodash";
import { generateModuleInstance } from "ee/entities/DataTree/dataTreeModuleInstance";
import {
  endSpan,
  startNestedSpan,
  startRootSpan,
} from "UITelemetry/generateTraces";
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
    const rootSpan = startRootSpan("DataTreeFactory.create");
    const actionsSpan = startNestedSpan("DataTreeFactory.actions", rootSpan);

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

    endSpan(actionsSpan);

    const startJsActions = performance.now();
    const jsActionsSpan = startNestedSpan(
      "DataTreeFactory.jsActions",
      rootSpan,
    );

    jsActions.forEach((js) => {
      const { configEntity, unEvalEntity } = generateDataTreeJSAction(js);

      dataTree[js.config.name] = unEvalEntity;
      configTree[js.config.name] = configEntity;
    });
    const endJsActions = performance.now();

    endSpan(jsActionsSpan);

    const startWidgets = performance.now();
    const widgetsSpan = startNestedSpan("DataTreeFactory.widgets", rootSpan);

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

    endSpan(widgetsSpan);

    dataTree.appsmith = {
      ...appData,
      // combine both persistent and transient state with the transient state
      // taking precedence in case the key is the same
      store: appData.store,
      theme,
    } as AppsmithEntity;
    (dataTree.appsmith as AppsmithEntity).ENTITY_TYPE = ENTITY_TYPE.APPSMITH;

    const startMetaWidgets = performance.now();
    const metaWidgetsSpan = startNestedSpan(
      "DataTreeFactory.metaWidgets",
      rootSpan,
    );

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

    endSpan(metaWidgetsSpan);
    endSpan(rootSpan);

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
export type { EntityTypeValue };
