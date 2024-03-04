import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

/**
 * This action saves details about js action execution to the audit logs.
 * It uses /analytics/event because audit-logs is piggy-backing on the
 * analytics event.
 * @param payload
 */
export const logActionExecutionForAudit = (payload: {
  actionId: string;
  pageId: string;
  collectionId: string;
  actionName: string;
  pageName: string;
}) => {
  return {
    type: ReduxActionTypes.AUDIT_LOGS_LOG_ACTION_EXECUTION,
    payload,
  };
};
