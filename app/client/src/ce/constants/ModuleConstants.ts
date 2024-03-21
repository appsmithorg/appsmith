import type { PluginType } from "entities/Action";

type ID = string;

export enum MODULE_TYPE {
  QUERY = "QUERY_MODULE",
  JS = "JS",
  UI = "UI",
}

export interface ModuleInput {
  id: string;
  propertyName: string;
}
export interface ModuleInputSection {
  id: string;
  children?: ModuleInput[];
}

export interface Module extends ModuleMetadata {
  id: ID;
  name: string;
  packageId: ID;
  inputsForm: ModuleInputSection[];
  type: MODULE_TYPE;
}

export interface ModuleMetadata {
  moduleId: string;
  datasourceId?: string;
  pluginId: string;
  pluginType: PluginType;
}
