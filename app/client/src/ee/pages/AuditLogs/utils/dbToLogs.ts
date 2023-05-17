import type { AuditLogType } from "../types";

export function dbToLogs(serverLogs: any[]): AuditLogType[] {
  return serverLogs.map((serverLog: any) => ({
    event: serverLog.event || ".",
    timestamp: new Date(Number(serverLog.timestamp) * 1000).toLocaleString(),
    resource: serverLog.resource || {},
    invitedUsers: serverLog.invitedUsers || [],
    authentication: serverLog.authentication || {},
    page: serverLog.page || {},
    application: serverLog.application || {},
    workspace: serverLog.workspace || {},
    user: serverLog.user || {},
    userGroup: serverLog.group || {},
    permissionGroup: serverLog.role || {},
    instanceSettings: serverLog.instanceSettings || [],
    metadata: serverLog.metadata || {},
    userPermissions: serverLog.userPermissions || [],
    id: serverLog.id || -1 /* mongodb record id */,
  }));
}
