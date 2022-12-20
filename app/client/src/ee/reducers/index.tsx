export * from "ce/reducers";
import {
  reducerObject as CE_AppReducer,
  AppState as CE_AppState,
} from "ce/reducers";
import { combineReducers } from "redux";
import aclReducer, { AclReduxState } from "./aclReducers";
import auditLogsReducer, { AuditLogsReduxState } from "./auditLogsReducer";
import environmentReducer, {
  EnvironmentsReduxState,
} from "./environmentReducer";

const appReducer = combineReducers({
  ...CE_AppReducer,
  acl: aclReducer,
  auditLogs: auditLogsReducer,
  environments: environmentReducer,
});

export interface AppState extends CE_AppState {
  acl: AclReduxState;
  auditLogs: AuditLogsReduxState;
  environments: EnvironmentsReduxState;
}

export default appReducer;
