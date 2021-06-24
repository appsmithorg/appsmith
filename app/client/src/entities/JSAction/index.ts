import { DynamicPath } from "../../utils/DynamicBindingUtils";

export enum PluginType {
  JS = "JS",
}

export enum PaginationType {
  NONE = "NONE",
  PAGE_NO = "PAGE_NO",
  URL = "URL",
}

interface BaseAction {
  id: string;
  name: string;
  organizationId: string;
  pageId: string;
  collectionId?: string;
  pluginId: string;
  pluginType: string;
  executeOnLoad?: boolean;
  dynamicBindingPathList?: DynamicPath[];
  isValid?: boolean;
  invalids?: string[];
  cacheResponse?: string;
  confirmBeforeExecute?: boolean;
  eventData?: any;
}

export interface JSAction extends BaseAction {
  variables: any;
  actionConfiguration: any;
  actions: Array<JSSubAction>;
}
export interface JSSubAction {
  actionId: string;
  name: string;
  parentObjectId: string;
  executeOnLoad: boolean;
  actionConfiguration: {
    body: string;
    isAsync: boolean;
    arguments: Array<string>;
    timeoutInMilliseconds: number;
  };
}
