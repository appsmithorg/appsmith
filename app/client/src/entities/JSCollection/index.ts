import { BaseAction } from "../Action";
import { PluginType } from "entities/Action";

export type Variable = {
  name: string;
  value: any;
};
export interface JSCollection {
  id: string;
  applicationId: string;
  organizationId: string;
  name: string;
  pageId: string;
  pluginId: string;
  pluginType: PluginType.JS;
  actions: Array<JSAction>;
  body: string;
  variables: Array<Variable>;
}

export interface JSActionConfig {
  body: string;
  isAsync: boolean;
  timeoutInMilliseconds: number;
  jsArguments: Array<Variable>;
}
export interface JSAction extends BaseAction {
  actionConfiguration: JSActionConfig;
}
