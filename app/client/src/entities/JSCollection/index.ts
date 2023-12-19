import type { BaseAction } from "../Action";
import type { PluginType } from "entities/Action";
import type { LayoutOnLoadActionErrors } from "constants/AppsmithActionConstants/ActionConstants";
import type { ActionContextType } from "@appsmith/entities/DataTree/types";

export interface Variable {
  name: string;
  value: any;
}
export interface JSCollection {
  id: string;
  applicationId: string;
  workspaceId: string;
  name: string;
  pageId: string;
  pluginId: string;
  pluginType: PluginType.JS;
  actions: Array<JSAction>;
  body: string;
  variables: Array<Variable>;
  userPermissions?: string[];
  errorReports?: Array<LayoutOnLoadActionErrors>;
  isPublic?: boolean;
  moduleId?: string;
  moduleInstanceId?: string;
  workflowId?: string;
  contextType?: ActionContextType;
  // This is used to identify the main js collection of a workflow
  // main js collection is the entrypoint for a workflow
  // cannot be deleted or renamed
  isMainJSCollection?: boolean;
}

export interface JSActionConfig {
  body: string;
  timeoutInMillisecond: number;
  jsArguments: Array<Variable>;
}
export interface JSAction extends BaseAction {
  actionConfiguration: JSActionConfig;
  clientSideExecution: boolean;
  fullyQualifiedName?: string;
}
