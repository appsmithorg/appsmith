import { createSelector } from "reselect";
import {
  getCurrentActions,
  getAppData,
  getPluginDependencyConfig,
  getPluginEditorConfigs,
  getCurrentJSCollections,
  getInputsForModule,
  getModuleInstances,
  getModuleInstanceEntities,
  getCurrentModuleActions,
  getCurrentModuleJSCollections,
} from "ee/selectors/entitiesSelector";
import type { AppsmithEntity, WidgetEntity } from "ee/entities/DataTree/types";
import type {
  ConfigTree,
  DataTree,
  UnEvalTree,
} from "entities/DataTree/dataTreeTypes";
import { DataTreeFactory } from "entities/DataTree/dataTreeFactory";
import {
  getIsMobileBreakPoint,
  getMetaWidgets,
  getWidgets,
  getWidgetsMeta,
} from "sagas/selectors";
import "url-search-params-polyfill";
import type { AppState } from "ee/reducers";
import { getSelectedAppThemeProperties } from "./appThemingSelectors";
import type { LoadingEntitiesState } from "reducers/evaluationReducers/loadingEntitiesReducer";
import _, { get } from "lodash";
import type { EvaluationError } from "utils/DynamicBindingUtils";
import { getEvalErrorPath } from "utils/DynamicBindingUtils";
import ConfigTreeActions from "utils/configTree";
import { DATATREE_INTERNAL_KEYWORDS } from "constants/WidgetValidation";
import { getLayoutSystemType } from "./layoutSystemSelectors";
import {
  getCurrentWorkflowActions,
  getCurrentWorkflowJSActions,
} from "ee/selectors/workflowSelectors";
import { endSpan, startRootSpan } from "UITelemetry/generateTraces";

export const getLoadingEntities = (state: AppState) =>
  state.evaluations.loadingEntities;

/**
 * This selector is created to combine a couple of data points required by getUnevaluatedDataTree selector.
 * Current version of reselect package only allows upto 12 arguments. Hence, this workaround.
 * TODO: Figure out a better way to do this in a separate task. Or update the package if possible.
 */
const getLayoutSystemPayload = createSelector(
  getLayoutSystemType,
  getIsMobileBreakPoint,
  (layoutSystemType, isMobile) => {
    return {
      layoutSystemType,
      isMobile,
    };
  },
);

const getCurrentActionsEntities = createSelector(
  getCurrentActions,
  getCurrentModuleActions,
  getCurrentWorkflowActions,
  (actions, moduleActions, workflowActions) => [
    ...actions,
    ...moduleActions,
    ...workflowActions,
  ],
);
const getCurrentJSActionsEntities = createSelector(
  getCurrentJSCollections,
  getCurrentModuleJSCollections,
  getCurrentWorkflowJSActions,
  (jsActions, moduleJSActions, workflowJsActions) => [
    ...jsActions,
    ...moduleJSActions,
    ...workflowJsActions,
  ],
);

const getModulesData = createSelector(
  getInputsForModule,
  getModuleInstances,
  getModuleInstanceEntities,
  (moduleInputs, moduleInstances, moduleInstanceEntities) => {
    return {
      moduleInputs: moduleInputs,
      moduleInstances: moduleInstances,
      moduleInstanceEntities: moduleInstanceEntities,
    };
  },
);

const getActionsFromUnevaluatedTree = createSelector(
  getCurrentActionsEntities,
  getPluginEditorConfigs,
  getPluginDependencyConfig,
  (actions, editorConfigs, pluginDependencyConfig) => {
    const { configTree, dataTree } = DataTreeFactory.actions(
      actions,
      editorConfigs,
      pluginDependencyConfig,
    );

    return {
      configTree,
      dataTree,
    };
  },
);

const getJSActionsFromUnevaluatedTree = createSelector(
  getCurrentJSActionsEntities,
  (jsActions) => {
    return DataTreeFactory.jsActions(jsActions);
  },
);

const getModuleComponentsFromUnEvaluatedTree = createSelector(
  getModulesData,

  (moduleData) => {
    const { moduleInputs, moduleInstanceEntities, moduleInstances } =
      moduleData;

    return DataTreeFactory.moduleComponents(
      moduleInputs,
      moduleInstances,
      moduleInstanceEntities,
    );
  },
);

const getWidgetsFromUnevaluatedTree = createSelector(
  getModuleComponentsFromUnEvaluatedTree,
  getWidgets,
  getWidgetsMeta,
  getLoadingEntities,
  getLayoutSystemPayload,
  (moduleData, widgets, widgetsMeta, loadingEntities, layoutSystemPayload) => {
    const { isMobile, layoutSystemType } = layoutSystemPayload;

    const widgetsDataTree = DataTreeFactory.widgets(
      widgets,
      widgetsMeta,
      loadingEntities,
      layoutSystemType,
      isMobile,
    );

    return {
      configTree: { ...moduleData.configTree, ...widgetsDataTree.configTree },
      dataTree: { ...moduleData.dataTree, ...widgetsDataTree.dataTree },
    };
  },
);
const getMetaWidgetsFromUnevaluatedTree = createSelector(
  getMetaWidgets,
  getWidgetsMeta,
  getLoadingEntities,
  (metaWidgets, widgetsMeta, loadingEntities) => {
    return DataTreeFactory.metaWidgets(
      metaWidgets,
      widgetsMeta,
      loadingEntities,
    );
  },
);

export const getEvaluationInverseDependencyMap = (state: AppState) =>
  state.evaluations.dependencies.inverseDependencyMap;

export const getUnevaluatedDataTree = createSelector(
  getActionsFromUnevaluatedTree,
  getJSActionsFromUnevaluatedTree,
  getWidgetsFromUnevaluatedTree,
  getAppData,
  getSelectedAppThemeProperties,
  getMetaWidgetsFromUnevaluatedTree,
  (actions, jsActions, widgets, appData, theme, metaWidgets) => {
    let dataTree: UnEvalTree = {};
    let configTree: ConfigTree = {};
    const rootSpan = startRootSpan("DataTreeFactory.create");

    configTree = {
      ...actions.configTree,
      ...jsActions.configTree,
      ...widgets.configTree,
    };
    dataTree = {
      ...actions.dataTree,
      ...jsActions.dataTree,
      ...widgets.dataTree,
    };

    dataTree.appsmith = {
      ...appData,
      // combine both persistent and transient state with the transient state
      // taking precedence in case the key is the same
      store: appData.store,
      theme,
    } as AppsmithEntity;
    configTree = { ...configTree, ...metaWidgets.configTree };
    dataTree = { ...dataTree, ...metaWidgets.dataTree };

    endSpan(rootSpan);

    return {
      configTree,
      unEvalTree: dataTree,
    };
  },
);
export const getIsWidgetLoading = createSelector(
  [getLoadingEntities, (_state: AppState, widgetName: string) => widgetName],
  (loadingEntities: LoadingEntitiesState, widgetName: string) =>
    loadingEntities.has(widgetName),
);

/**
 * returns evaluation tree object
 *
 * @param state
 */
export const getDataTree = (state: AppState): DataTree =>
  state.evaluations.tree;

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getConfigTree = (): any => {
  return ConfigTreeActions.getConfigTree();
};

export const getWidgetEvalValues = createSelector(
  [getDataTree, (_state: AppState, widgetName: string) => widgetName],
  (tree: DataTree, widgetName: string) => tree[widgetName] as WidgetEntity,
);

// For autocomplete. Use actions cached responses if
// there isn't a response already
export const getDataTreeForAutocomplete = createSelector(
  getDataTree,
  (tree: DataTree) => {
    return _.omit(tree, Object.keys(DATATREE_INTERNAL_KEYWORDS));
  },
);

export const getPathEvalErrors = createSelector(
  [
    getDataTreeForAutocomplete,
    (_: unknown, dataTreePath: string) => dataTreePath,
  ],
  (dataTree: DataTree, dataTreePath: string) =>
    get(dataTree, getEvalErrorPath(dataTreePath), []) as EvaluationError[],
);
