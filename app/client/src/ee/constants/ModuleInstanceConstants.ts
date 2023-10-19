export type ModuleId = string;
export type ModuleInstanceId = string;
export enum ModuleType {
  QUERY,
  JS_OBJECT,
  UI,
}

export enum ModuleInstanceCreatorType {
  MODULE = "MODULE",
  PAGE = "PAGE",
}
export interface ModuleInstance {
  id: ModuleInstanceId;
  type: ModuleType;
  moduleId: ModuleId;
  name: string;
  pageId: string;
  inputs: {
    [key: string]: string;
  };
  dynamicBindingPathList: {
    [key: string]: boolean;
  };
  jsonPathKeys: {
    [key: string]: any;
  };
}
export interface QueryModuleInstance extends ModuleInstance {
  type: ModuleType.QUERY;
  jsonPathKeys: string[];
  dynamicBindingPathList: Record<string, true>;
  data: string;
  run: string;
}
