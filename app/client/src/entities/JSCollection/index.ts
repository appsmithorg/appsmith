import type { BaseAction } from "../Action";
import type { PluginType } from "entities/Action";
import type { LayoutOnLoadActionErrors } from "constants/AppsmithActionConstants/ActionConstants";

export type Variable = {
  name: string;
  value: any;
};
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
}

export interface JSActionConfig {
  body: string;
  isAsync: boolean;
  timeoutInMillisecond: number;
  jsArguments: Array<Variable>;
}
export interface JSAction extends BaseAction {
  actionConfiguration: JSActionConfig;
  clientSideExecution: boolean;
}
