import type { ActionMapType } from "./description";

/* Slightly modified AuditLogs/utils/invited.ts
 * to return a description of the action performed on a group or role
 */
export function getGroupandRoleActionDescription(
  actionObj: ActionMapType,
  users: string[],
  resourceName = "",
) {
  if (users.length === 1) {
    return {
      mainDescription: {
        actionType: `${actionObj?.action}`,
        resourceType: `${users[0]}`,
      },
      subDescription: `${actionObj?.preposition} ${resourceName}`,
    };
  } else if (users.length > 1) {
    const u1 = users[0];
    const rest = users.length - 1;
    const userString = rest > 1 ? "users" : "user";
    return {
      mainDescription: {
        actionType: `${actionObj?.action}`,
        resourceType: `${u1} and ${rest} more ${userString}`,
      },
      subDescription: `${actionObj?.preposition} ${resourceName}`,
    };
  } else {
    return {
      mainDescription: {
        actionType: `${actionObj?.action}.)`,
        resourceType: `(No one was`,
      },
      subDescription: "",
    };
  }
}
