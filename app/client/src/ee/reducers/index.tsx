export * from "ce/reducers";
import type { AppState as CE_AppState } from "ce/reducers";
import { reducerObject as CE_AppReducer } from "ce/reducers";
import { combineReducers } from "redux";
import type { AclReduxState } from "./aclReducers";
import aclReducer from "./aclReducers";
import type { AuditLogsReduxState } from "./auditLogsReducer";
import auditLogsReducer from "./auditLogsReducer";
import type { EnvironmentsReduxState } from "./environmentReducer";
import environmentReducer from "./environmentReducer";
import type { AIReduxState } from "./AIReducer";
import AIReducer from "./AIReducer";
import ProvisioningReducer from "./ProvisioningReducer";
import type { PackagesReducerState } from "./entityReducers/packagesReducer";
import type { ModulesReducerState } from "./entityReducers/modulesReducer";
import type { ModuleInstanceReducerState } from "./entityReducers/moduleInstancesReducer";
import type { ModuleInstancePaneState } from "./uiReducers/moduleInstancePaneReducer";
import type { WorkflowsReducerState } from "./entityReducers/workflowsReducer";
import type { ModuleInstanceEntitiesReducerState } from "./entityReducers/moduleInstanceEntitiesReducer";
import type { ActionDataState } from "@appsmith/reducers/entityReducers/actionsReducer";

const appReducer = combineReducers({
  ...CE_AppReducer,
  acl: aclReducer,
  auditLogs: auditLogsReducer,
  environments: environmentReducer,
  ai: AIReducer,
  provisioning: ProvisioningReducer,
});

export interface AppState extends CE_AppState {
  acl: AclReduxState;
  auditLogs: AuditLogsReduxState;
  environments: EnvironmentsReduxState;
  ai: AIReduxState;
  provisioning: any;
  entities: CE_AppState["entities"] & {
    packages: PackagesReducerState;
    modules: ModulesReducerState;
    moduleInstances: ModuleInstanceReducerState;
    workflows: WorkflowsReducerState;
    moduleInstanceEntities: ModuleInstanceEntitiesReducerState;
    actions: ActionDataState;
  };
  ui: CE_AppState["ui"] & {
    moduleInstancePane: ModuleInstancePaneState;
  };
}

export default appReducer;
