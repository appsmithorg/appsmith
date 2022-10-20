import {
  AuditLogType,
  AuthenticationType,
  DescriptionDataType,
} from "../types";
import { EVENT_ICON_MAP, IconInfo } from "./icons";
import { splitJoin } from "./splitJoin";
import { titleCase } from "./titleCase";
import { ellipsis } from "./ellipsis";
import { invited } from "./invited";

const ACTION_MAP: Record<string, string> = {
  cloned: "cloned in",
  created: "created in",
  executed: "executed in",
  deleted: "deleted in",
  deployed: "deployed in",
  exported: "exported from",
  forked: "forked to",
  imported: "imported to",
  logged_in: "logged in",
  logged_out: "logged out",
  signed_up: "signed up",
  updated: "updated in",
  viewed: "viewed in",
};

const RESOURCE_DESCRIPTION_MAP: Record<
  string,
  (data: DescriptionDataType) => string
> = {
  application: (data: DescriptionDataType) =>
    `${data.resource} ${ACTION_MAP[data.action]} ${data.workspace}`,
  datasource: (data: DescriptionDataType) =>
    `${data.resource} ${ACTION_MAP[data.action]} ${data.workspace}`,
  page: (data: DescriptionDataType) =>
    `${data.resource} ${ACTION_MAP[data.action]} ${data.application}`,
  query: (data: DescriptionDataType) =>
    `${data.resource} ${ACTION_MAP[data.action]} ${data.page}`,
  workspace: (data: DescriptionDataType) => `${data.resource} ${data.action}`,
  user: (data: DescriptionDataType) =>
    `${data.userName || data.userEmail} ${ACTION_MAP[data.action]}`,
};

/**
 * generateDescription generates event description
 * based on current audit log record
 * @param log {AuditLogType}
 * @returns {string} the description string that is shown
 * in the description column of the audit logs table
 */
export function generateDescription(log: AuditLogType) {
  const noUser = { name: "(No name)", email: "(No email)" };
  const { event = ".", user = noUser } = log;
  const [resourceType, action] = event.split(".");
  const data: DescriptionDataType = {
    action,
    application: ellipsis(log.application?.name || "(No application)"),
    resource: ellipsis(log.resource?.name || "(No resource)"),
    workspace: ellipsis(log.workspace?.name || "(No workspace)"),
    page: ellipsis(log.page?.name || "(No page)"),
    userName: user.name,
    userEmail: user.email,
  };

  if (event === "application.forked") {
    /* Special case: forked has "... from ... to ..." structure.
     * It's unique. Thus this early return.
     */
    return `${data.resource} forked from ${data.workspace} to ${ellipsis(
      log.workspace?.destination?.name || "",
    )}`;
  }
  if (event === "user.invited") {
    /* Special case: invited has "x user(s) invited" structure
     * It is unique, Thus this early return.
     */
    const invitees = log?.invitedUsers?.map((user) => ellipsis(user)) || [];
    return invited(invitees);
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
    return `${mode} authentication ${action.toLowerCase()}`;
  }

  const knownResourceType = [
    "application",
    "datasource",
    "page",
    "query",
    "workspace",
    "user",
  ].includes(resourceType);

  return knownResourceType
    ? RESOURCE_DESCRIPTION_MAP[resourceType](data)
    : `${ellipsis(titleCase(splitJoin(resourceType)))} ${splitJoin(action)}`;
}

export type IconisedDescription = {
  hasDescriptiveIcon: boolean;
  icon: IconInfo;
  description: string;
};

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
