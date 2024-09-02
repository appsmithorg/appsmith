import type { BaseAction } from "../Action";
import type { PluginType } from "entities/Action";
import type { LayoutOnLoadActionErrors } from "constants/AppsmithActionConstants/ActionConstants";
import type { ActionParentEntityTypeInterface } from "ee/entities/Engine/actionHelpers";

export interface Variable {
  name: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
}
export interface JSCollection {
  id: string;
  baseId: string;
  applicationId: string;
  workspaceId: string;
  name: string;
  pageId: string;
  pluginId: string;
  pluginType: PluginType.JS;
  actions: Array<JSAction>;
  body?: string;
  variables?: Array<Variable>;
  userPermissions?: string[];
  errorReports?: Array<LayoutOnLoadActionErrors>;
  isPublic?: boolean;
  moduleId?: string;
  moduleInstanceId?: string;
  workflowId?: string;
  contextType?: ActionParentEntityTypeInterface;
  // This is used to identify the main js collection of a workflow
  // main js collection is the entrypoint for a workflow
  // cannot be deleted or renamed
  isMainJSCollection?: boolean;
  displayName?: string;
}

export interface JSActionConfig {
  body?: string;
  timeoutInMillisecond: number;
  jsArguments?: Array<Variable>;
}
export interface JSAction extends BaseAction {
  actionConfiguration: JSActionConfig;
  clientSideExecution: boolean;
  fullyQualifiedName?: string;
}
