import type { PluginType, MODULE_TYPE } from "@appsmith/types";

type ID = string;

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
