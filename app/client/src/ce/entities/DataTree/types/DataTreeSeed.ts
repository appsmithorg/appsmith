import type { CanvasWidgetsReduxState } from "ee/reducers/entityReducers/canvasWidgetsReducer";
import type { ActionDataState } from "ee/reducers/entityReducers/actionsReducer";
import type DependencyMap from "entities/DependencyMap";
import type { MetaState } from "reducers/entityReducers/metaReducer";
import type { AppDataState } from "reducers/entityReducers/appReducer";
import type { JSCollectionDataState } from "ee/reducers/entityReducers/jsActionsReducer";
import type { MetaWidgetsReduxState } from "reducers/entityReducers/metaWidgetsReducer";
import type { AppTheme } from "entities/AppTheming";
import type { Module } from "ee/constants/ModuleConstants";
import type { ModuleInstance } from "ee/constants/ModuleInstanceConstants";
import type { LayoutSystemTypes } from "layoutSystems/types";
import type { LoadingEntitiesState } from "reducers/evaluationReducers/loadingEntitiesReducer";

export interface DataTreeSeed {
  actions: ActionDataState;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editorConfigs: Record<string, any[]>;
  pluginDependencyConfig: Record<string, DependencyMap>;
  widgets: CanvasWidgetsReduxState;
  widgetsMeta: MetaState;
  appData: AppDataState;
  jsActions: JSCollectionDataState;
  theme: AppTheme["properties"];
  metaWidgets: MetaWidgetsReduxState;
  isMobile: boolean;
  moduleInputs: Module["inputsForm"];
  moduleInstances: Record<string, ModuleInstance> | null;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  moduleInstanceEntities: any;
  layoutSystemType: LayoutSystemTypes;
  loadingEntities: LoadingEntitiesState;
}
