import type { PluginType } from "entities/Plugin";

type ID = string;

export enum MODULE_TYPE {
  QUERY = "QUERY_MODULE",
  JS = "JS_MODULE",
  UI = "UI_MODULE",
}

export interface ModuleInput {
  id: string;
  propertyName: string;
}
export interface ModuleInputSection {
  id: string;
  children?: ModuleInput[];
}

export interface Module
  extends Pick<ModuleMetadata, "pluginId" | "pluginType" | "datasourceId"> {
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

export enum PACKAGE_PULL_STATUS {
  UPGRADABLE = "UPGRADABLE",
  UPGRADED = "UPGRADED",
  UPGRADING = "UPGRADING",
}
