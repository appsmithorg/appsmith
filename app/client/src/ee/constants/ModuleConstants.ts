export * from "ce/constants/ModuleConstants";
import type {
  Module as CE_Module,
  ModuleInputSection as CE_ModuleInputSection,
  ModuleInput as CE_ModuleInput,
} from "ce/constants/ModuleConstants";
import type { ControlData } from "components/formControls/BaseControl";
import type { Action } from "entities/Action";

export enum MODULE_TYPE {
  QUERY = "QUERY_MODULE",
  JS = "JS",
  UI = "UI",
}

export enum MODULE_PREFIX {
  QUERY = "Query",
}

export type ModuleAction = Action & {
  moduleId: string;
  packageId: string;
};
export interface ModuleInput extends CE_ModuleInput {
  label: string;
  defaultValue: string;
  controlType: string;
}

export interface PluginSettings {
  id: number;
  sectionName: string;
  children: ControlData[];
}

export interface ModuleInputSection extends CE_ModuleInputSection {
  sectionName: string;
  children: ModuleInput[];
}

export interface Module extends CE_Module {
  inputsForm: ModuleInputSection[];
  settingsForm: PluginSettings[];
  type: MODULE_TYPE;
  userPermissions: string[];
}
