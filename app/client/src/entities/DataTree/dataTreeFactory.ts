import { generateDataTreeAction } from "ee/entities/DataTree/dataTreeAction";
import { generateDataTreeJSAction } from "ee/entities/DataTree/dataTreeJSAction";
import { generateDataTreeWidget } from "entities/DataTree/dataTreeWidget";
import {
  ENTITY_TYPE,
  EvaluationSubstitutionType,
} from "ee/entities/DataTree/types";
import { generateDataTreeModuleInputs } from "ee/entities/DataTree/utils";
import type { EntityTypeValue } from "ee/entities/DataTree/types";
import type { ConfigTree, UnEvalTree } from "entities/DataTree/dataTreeTypes";
import { isEmpty } from "lodash";
import { generateModuleInstance } from "ee/entities/DataTree/dataTreeModuleInstance";
import { endSpan, startRootSpan } from "instrumentation/generateTraces";
import type { ActionDataState } from "ee/reducers/entityReducers/actionsReducer";
import type { JSCollectionDataState } from "ee/reducers/entityReducers/jsActionsReducer";
import type { LayoutSystemTypes } from "layoutSystems/types";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type { MetaState } from "reducers/entityReducers/metaReducer";
import type { LoadingEntitiesState } from "reducers/evaluationReducers/loadingEntitiesReducer";
import type { MetaWidgetsReduxState } from "reducers/entityReducers/metaWidgetsReducer";
import type { Module } from "ee/constants/ModuleConstants";
import type { ModuleInstance } from "ee/constants/ModuleInstanceConstants";
import type {
  DependencyMap,
  FormEditorConfigs,
} from "utils/DynamicBindingUtils";
import type { DataTreeSeed } from "ee/entities/DataTree/types";

export class DataTreeFactory {
  public static metaWidgets(
    metaWidgets: MetaWidgetsReduxState,
    widgetsMeta: MetaState,
    loadingEntities: LoadingEntitiesState,
  ) {
    const dataTree: UnEvalTree = {};
    const configTree: ConfigTree = {};
    const metaWidgetsSpan = startRootSpan("DataTreeFactory.metaWidgets");

    Object.values(metaWidgets).forEach((widget) => {
      const { configEntity, unEvalEntity } = generateDataTreeWidget(
        widget,
        widgetsMeta[widget.metaWidgetId || widget.widgetId],
        loadingEntities,
      );

      dataTree[widget.widgetName] = unEvalEntity;
      configTree[widget.widgetName] = configEntity;
    });
    endSpan(metaWidgetsSpan);

    return {
      dataTree,
      configTree,
    };
  }

  public static widgets(
    moduleInputs: Module["inputsForm"],
    moduleInstances: Record<string, ModuleInstance> | null,
    moduleInstanceEntities: DataTreeSeed["moduleInstanceEntities"],
    widgets: CanvasWidgetsReduxState,
    widgetsMeta: MetaState,
    loadingEntities: LoadingEntitiesState,
    layoutSystemType: LayoutSystemTypes,
    isMobile: boolean,
  ) {
    const dataTree: UnEvalTree = {};
    const configTree: ConfigTree = {};
    const widgetsSpan = startRootSpan("DataTreeFactory.widgets");

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
    endSpan(widgetsSpan);

    return {
      dataTree,
      configTree,
    };
  }

  public static jsActions(jsActions: JSCollectionDataState) {
    const dataTree: UnEvalTree = {};
    const configTree: ConfigTree = {};
    const actionsSpan = startRootSpan("DataTreeFactory.jsActions");

    jsActions.forEach((js) => {
      const { configEntity, unEvalEntity } = generateDataTreeJSAction(js);

      dataTree[js.config.name] = unEvalEntity;
      configTree[js.config.name] = configEntity;
    });
    endSpan(actionsSpan);

    return {
      dataTree,
      configTree,
    };
  }

  public static actions(
    actions: ActionDataState,
    editorConfigs: FormEditorConfigs,
    pluginDependencyConfig: Record<string, DependencyMap>,
  ) {
    const dataTree: UnEvalTree = {};
    const configTree: ConfigTree = {};
    const actionsSpan = startRootSpan("DataTreeFactory.actions");

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
    endSpan(actionsSpan);

    return {
      dataTree,
      configTree,
    };
  }
}

export { ENTITY_TYPE, EvaluationSubstitutionType };
export type { EntityTypeValue };
