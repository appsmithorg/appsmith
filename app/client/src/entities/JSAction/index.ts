import { BaseAction } from "../Action";
import { PluginType } from "entities/Action";

export type Variable = {
  name: string;
  value: any;
};
export interface JSAction extends BaseAction {
  body: string;
  pluginType: PluginType.JS;
  applicationId: string;
  variables: Array<Variable>;
  actions: Array<JSSubAction>;
  organizationId: string;
  pluginId: string;
}
export interface JSSubAction {
  id: string;
  name: string;
  collectionId: string;
  executeOnLoad: boolean;
  organizationId: string;
  pageId: string;
  actionConfiguration: {
    body: string;
    isAsync: boolean;
    timeoutInMilliseconds: number;
    jsArguments?: Array<Variable>;
  };
}

export type JSActionViewMode = {
  id: string;
  name: string;
  pageId: string;
  jsonPathKeys: string[];
  confirmBeforeExecute?: boolean;
  timeoutInMillisecond?: number;
};
