import type { AuditLogType } from "../types";
import { removeEmptyNestedObjects } from "./removeEmptyNestedObjects";

/**
 * reduxToUI removes things that are necessary for redux/app to work,
 * but are not important for users to read.
 * @param log {AuditLogType} The log from redux store.
 */
export function reduxToUI(log: AuditLogType): Partial<AuditLogType> {
  const newLog = { ...log } as AuditLogType;
  /* isOpen is used to track whether the user has expanded the log or not */
  delete newLog.isOpen;
  /* userPermissions is BE only info; no need to show it to the user. */
  delete newLog.userPermissions;
  /* remove all of the empty objects */
  return removeEmptyNestedObjects<AuditLogType>(newLog);
}
