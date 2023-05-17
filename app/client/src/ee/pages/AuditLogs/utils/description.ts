import type {
  AuditLogType,
  AuthenticationType,
  DescriptionDataType,
  PermissionGroupType,
} from "../types";
import type { IconInfo } from "./icons";
import { EVENT_ICON_MAP } from "./icons";
import { splitJoin } from "./splitJoin";
import { titleCase } from "./titleCase";
import { ellipsis } from "./ellipsis";
import { invited } from "./invited";
import { getGroupandRoleActionDescription } from "./groupAndRoleInvite";
import camelCase from "lodash/camelCase";

export type MainDescriptionType = {
  resourceType: string;
  actionType: string;
};

export type MultilineDescription = {
  mainDescription: MainDescriptionType;
  subDescription: string;
};

export type IconisedDescription = {
  hasDescriptiveIcon: boolean;
  icon: IconInfo;
  description: MultilineDescription;
};

export type ActionMapType = {
  action: string;
  preposition: string;
};

export enum CRUD_ACTIONS {
  CREATED = "created",
  UPDATED = "updated",
  DELETED = "deleted",
}

const ACTION_MAP: Record<string, ActionMapType> = {
  cloned: { action: "cloned", preposition: "in" },
  created: { action: "created", preposition: "in" },
  executed: { action: "executed", preposition: "in" },
  deleted: { action: "deleted", preposition: "in" },
  deployed: { action: "deployed", preposition: "in" },
  exported: { action: "exported", preposition: "from" },
  forked: { action: "forked", preposition: "to" },
  imported: { action: "imported", preposition: "to" },
  logged_in: { action: "logged in", preposition: "" },
  logged_out: { action: "logged out", preposition: "" },
  signed_up: { action: "signed up", preposition: "" },
  updated: { action: "updated", preposition: "in" },
  viewed: { action: "viewed", preposition: "in" },
  invite_users: { action: "invited", preposition: "to" },
  remove_users: { action: "removed", preposition: "from" },
  assigned_users: { action: "associated", preposition: "to" },
  unassigned_users: { action: "removed", preposition: "from" },
  assigned_groups: { action: "associated", preposition: "to" },
  unassigned_groups: { action: "removed", preposition: "from" },
};

function createResourceDescription(
  resourceType: string,
  data: DescriptionDataType,
  description: MultilineDescription,
): MultilineDescription {
  description.mainDescription.resourceType = data.resource;
  description.mainDescription.actionType =
    ACTION_MAP[data.action]["action"] || "";

  switch (resourceType) {
    case "application":
      description.subDescription = `${ACTION_MAP[data.action]["preposition"]} ${
        data.workspace
      }`;
      break;
    case "datasource":
      description.subDescription = `${ACTION_MAP[data.action]["preposition"]} ${
        data.workspace
      }`;
      break;
    case "page":
      description.subDescription = `${ACTION_MAP[data.action]["preposition"]} ${
        data.application
      }`;
      break;
    case "query":
      description.subDescription = `${ACTION_MAP[data.action]["preposition"]} ${
        data.page
      }`;
      break;
    case "workspace":
      description.subDescription = "";
      break;
    case "user":
      description.mainDescription.resourceType =
        data.action ===
        "deleted" /* When user is deleted, we should show the deleted user and not the user who deleted it */
          ? data.resource
          : data.userName || data.userEmail;
      description.subDescription = "";
      break;
  }
  return description;
}

/**
 * generateDescription generates event description
 * based on current audit log record
 * @param log {AuditLogType}
 * @returns {string} the description string that is shown
 * in the description column of the audit logs table
 */
export function generateDescription(log: AuditLogType): MultilineDescription {
  const noUser = { name: "(No name)", email: "(No email)" };
  const { event = ".", user = noUser } = log;
  const [resourceType, action] = event.split(".");
  const description: MultilineDescription = {
    mainDescription: {
      actionType: "",
      resourceType: "",
    },
    subDescription: "",
  };
  // known events for groups and roles for which we already have a generated description
  const crudActions: string[] = Object.values(CRUD_ACTIONS);

  const data: DescriptionDataType = {
    action,
    application: ellipsis(log.application?.name || "(No application)", 65),
    resource: ellipsis(log.resource?.name || "(No resource)", 60),
    workspace: ellipsis(log.workspace?.name || "(No workspace)", 65),
    page: ellipsis(log.page?.name || "(No page)", 65),
    userName: ellipsis(user?.name || user?.email || "(No Name)", 60),
    userEmail: ellipsis(user?.email || "(No email)", 60),
  };

  if (event === "application.forked") {
    /* Special case: forked has "... from ... to ..." structure.
     * It's unique. Thus this early return.
     */
    description.mainDescription.resourceType = `${data.resource}`;
    description.mainDescription.actionType = `forked`;
    description.subDescription = `from ${ellipsis(
      data.workspace,
      30,
    )} to ${ellipsis(log.workspace?.destination?.name || "", 30)}`;
    return description;
  }
  if (event === "user.invited") {
    /* Special case: invited has "x user(s) invited" structure
     * It is unique, Thus this early return.
     */
    const invitees = log?.invitedUsers?.map((user) => ellipsis(user, 60)) || [];
    description.mainDescription.resourceType = invited(invitees);
    description.mainDescription.actionType = `invited`;
    description.subDescription = "to " + ellipsis(data.workspace, 65);
    return description;
  }

  if (resourceType === "group" && !crudActions.includes(action)) {
    // Special case: group invited users has "x user(s) invited/removed" structure
    const { userGroup = {} } = log;

    const users =
      action === "invite_users"
        ? userGroup?.invitedUsers?.map((user) => ellipsis(user)) || []
        : userGroup?.removedUsers?.map((user) => ellipsis(user)) || [];
    return getGroupandRoleActionDescription(
      ACTION_MAP[action],
      users,
      log.resource?.name,
    );
  }

  if (resourceType === "role" && !crudActions.includes(action)) {
    // Special case: role associated has "x user(s)/group(s) associated/removed" structure
    const { permissionGroup = {} } = log;
    const users =
      permissionGroup[camelCase(action) as keyof PermissionGroupType]?.map(
        (user) => ellipsis(user),
      ) || [];
    return getGroupandRoleActionDescription(
      ACTION_MAP[action],
      users,
      log.resource?.name,
    );
  }

  const authUpdated =
    event === "instance_setting.updated" &&
    log?.authentication?.action &&
    log?.authentication?.mode;
  if (authUpdated) {
    /* Special case: authentication:
     * {mode} authentication {action}
     */
    const { action, mode } = log.authentication as AuthenticationType;
    description.mainDescription.resourceType = `${mode} authentication`;
    description.mainDescription.actionType = action.toLowerCase();
    return description;
  }

  const knownResourceType = [
    "application",
    "datasource",
    "page",
    "query",
    "workspace",
    "user",
    "group",
    "role",
  ].includes(resourceType);

  if (knownResourceType) {
    return createResourceDescription(resourceType, data, description);
  } else {
    description.mainDescription.resourceType = ellipsis(
      titleCase(splitJoin(resourceType)),
      60,
    );
    description.mainDescription.actionType = splitJoin(action);
  }
  return description;
}

/**
 * iconisedDescription is responsible for generating
 * a description, iconName, iconFillColor based on current audit log record
 * @param log {AuditLogType}
 * @returns {{hasDescriptiveIcon: boolean, icon: IconInfo, description: string}}
 * the description and the icon information
 */
export function iconisedDescription(log: AuditLogType): IconisedDescription {
  const description = generateDescription(log);
  const action = log.event?.split(".")[1];
  const icon = EVENT_ICON_MAP[action] || ["", ""];
  return { hasDescriptiveIcon: !!icon[0], icon, description };
}
