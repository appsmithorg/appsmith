import { DynamicPath } from "../../utils/DynamicBindingUtils";
import { BaseAction } from "../Action";
export enum PluginType {
  JS = "JS",
}

export enum PaginationType {
  NONE = "NONE",
  PAGE_NO = "PAGE_NO",
  URL = "URL",
}

export type variable = {
  name: string;
  value: any;
};
export interface JSAction extends BaseAction {
  body: string;
  pluginType: PluginType.JS;
  applicationId: string;
  variables: Array<variable>;
  actions: Array<JSSubAction>;
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
    jsArguments?: Array<variable>;
  };
}
