import { BaseAction } from "../Action";
import { PluginType } from "entities/Action";

export type Variable = {
  name: string;
  value: any;
};
export interface JSAction {
  id: string;
  applicationId: string;
  organizationId: string;
  name: string;
  pageId: string;
  pluginId: string;
  pluginType: PluginType.JS;
  actions: Array<JSSubAction>;
  body: string;
  variables: Array<Variable>;
}

export interface JSSubActionConfig {
  body: string;
  isAsync: boolean;
  timeoutInMilliseconds: number;
  jsArguments: Array<Variable>;
}
export interface JSSubAction extends BaseAction {
  actionConfiguration: JSSubActionConfig;
}
