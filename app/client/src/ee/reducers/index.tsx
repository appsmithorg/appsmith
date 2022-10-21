import auditLogsReducer, { AuditLogsReduxState } from "./auditLogsReducer";

export * from "ce/reducers";
import {
  reducerObject as CE_AppReducer,
  AppState as CE_AppState,
} from "ce/reducers";
import { combineReducers } from "redux";
import aclReducer, { AclReduxState } from "./aclReducers";

const appReducer = combineReducers({
  ...CE_AppReducer,
  acl: aclReducer,
  auditLogs: auditLogsReducer,
});

export interface AppState extends CE_AppState {
  acl: AclReduxState;
  auditLogs: AuditLogsReduxState;
}

export default appReducer;
