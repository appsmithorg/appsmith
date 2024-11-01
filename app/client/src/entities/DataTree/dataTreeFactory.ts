import { generateDataTreeAction } from "ee/entities/DataTree/dataTreeAction";
import { generateDataTreeJSAction } from "ee/entities/DataTree/dataTreeJSAction";
import { generateDataTreeWidget } from "entities/DataTree/dataTreeWidget";
import type { DependencyMap } from "utils/DynamicBindingUtils";

import {
  ENTITY_TYPE,
  EvaluationSubstitutionType,
} from "ee/entities/DataTree/types";
import { generateDataTreeModuleInputs } from "ee/entities/DataTree/utils";
import type { EntityTypeValue } from "ee/entities/DataTree/types";
import type { ConfigTree, UnEvalTree } from "entities/DataTree/dataTreeTypes";
import { isEmpty } from "lodash";
import { generateModuleInstance } from "ee/entities/DataTree/dataTreeModuleInstance";
import { endSpan, startRootSpan } from "UITelemetry/generateTraces";

import type { LayoutSystemTypes } from "layoutSystems/types";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type { MetaState } from "reducers/entityReducers/metaReducer";
import type { LoadingEntitiesState } from "reducers/evaluationReducers/loadingEntitiesReducer";
import type { MetaWidgetsReduxState } from "reducers/entityReducers/metaWidgetsReducer";
import type { ActionDataState } from "ee/reducers/entityReducers/actionsReducer";
import type { JSCollectionDataState } from "ee/reducers/entityReducers/jsActionsReducer";
import type { ModuleInputSection } from "ee/constants/ModuleConstants";
import type { ModuleInstance } from "ee/constants/ModuleInstanceConstants";

export class DataTreeFactory {
  static metaWidgets(
    metaWidgets: MetaWidgetsReduxState,
    widgetsMeta: MetaState,
    loadingEntities: LoadingEntitiesState,
  ) {
    const widgetsSpan = startRootSpan("DataTreeFactory.metaWidgets");

    const res = Object.values(metaWidgets).reduce(
      (acc, widget) => {
        const { configEntity, unEvalEntity } = generateDataTreeWidget(
          widget,
          widgetsMeta[widget.metaWidgetId || widget.widgetId],
          loadingEntities,
        );

        acc.unEvalTree[widget.widgetName] = unEvalEntity;
        acc.configTree[widget.widgetName] = configEntity;

        return acc;
      },
      { unEvalTree: {} as UnEvalTree, configTree: {} as ConfigTree },
    );

    endSpan(widgetsSpan);

    return res;
  }

  static widgets(
    widgets: CanvasWidgetsReduxState,
    widgetsMeta: MetaState,
    loadingEntities: LoadingEntitiesState,
    layoutSystemType: LayoutSystemTypes,
    isMobile: boolean,
  ) {
    const widgetsSpan = startRootSpan("DataTreeFactory.widgets");

    const unEvalTree: UnEvalTree = {};
    const configTree: ConfigTree = {};

    Object.values(widgets).forEach((widget) => {
      const { configEntity, unEvalEntity } = generateDataTreeWidget(
        widget,
        widgetsMeta[widget.metaWidgetId || widget.widgetId],
        loadingEntities,
        layoutSystemType,
        isMobile,
      );

      unEvalTree[widget.widgetName] = unEvalEntity;
      configTree[widget.widgetName] = configEntity;
    });

    endSpan(widgetsSpan);

    return { unEvalTree, configTree };
  }

  public static moduleComponents(
    moduleInputs: ModuleInputSection[],
    moduleInstances: Record<string, ModuleInstance> | null,
    moduleInstanceEntities: unknown,
  ) {
    const moduleComponentsSpan = startRootSpan(
      "DataTreeFactory.moduleComponents",
    );

    const unEvalTree: UnEvalTree = {};
    const configTree: ConfigTree = {};

    if (!isEmpty(moduleInputs)) {
      const { configEntity, unEvalEntity } =
        generateDataTreeModuleInputs(moduleInputs);

      if (!!configEntity && !!unEvalEntity) {
        unEvalTree.inputs = unEvalEntity;
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
          unEvalTree[moduleInstance.name] = unEvalEntity;
          configTree[moduleInstance.name] = configEntity;
        }
      });
    }

    endSpan(moduleComponentsSpan);

    return {
      unEvalTree,
      configTree,
    };
  }

  static jsActions(jsActions: JSCollectionDataState) {
    const actionsSpan = startRootSpan("DataTreeFactory.jsActions");

    const res = jsActions.reduce(
      (acc, js) => {
        const { configEntity, unEvalEntity } = generateDataTreeJSAction(js);

        acc.unEvalTree[js.config.name] = unEvalEntity;
        acc.configTree[js.config.name] = configEntity;

        return acc;
      },
      {
        unEvalTree: {} as UnEvalTree,
        configTree: {} as ConfigTree,
      },
    );

    endSpan(actionsSpan);

    return res;
  }

  public static actions(
    actions: ActionDataState,
    editorConfigs: Record<string, unknown[]>,
    pluginDependencyConfig: Record<string, DependencyMap>,
  ) {
    const actionsSpan = startRootSpan("DataTreeFactory.actions");

    const res = actions.reduce(
      (acc, action) => {
        const editorConfig = editorConfigs[action.config.pluginId];
        const dependencyConfig = pluginDependencyConfig[action.config.pluginId];
        const { configEntity, unEvalEntity } = generateDataTreeAction(
          action,
          editorConfig,
          dependencyConfig,
        );

        acc.unEvalTree[action.config.name] = unEvalEntity;
        acc.configTree[action.config.name] = configEntity;

        return acc;
      },
      { unEvalTree: {} as UnEvalTree, configTree: {} as ConfigTree },
    );

    endSpan(actionsSpan);

    return res;
  }
}

export { ENTITY_TYPE, EvaluationSubstitutionType };
export type { EntityTypeValue };
