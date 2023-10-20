export * from "ce/constants/ModuleConstants";
import type { Action } from "entities/Action";

type ID = string;

export interface ModuleInput {
  name: string;
  defaultValue?: string;
}

export enum MODULE_TYPE {
  QUERY = "QUERY",
  JS = "JS",
  UI = "UI",
}

export type ModuleAction = Action & {
  moduleId: string;
  packageId: string;
};

export interface Module {
  id: ID;
  name: string;
  packageId: ID;
  publicEntityId: ID;
  inputs: Record<ID, ModuleInput>;
  // list of settings enabled for module
  whitelistedPublicEntitySettingsForModule: string[];
  /**
   * list of settings enabled for module instance
   * for JSObject as public, value => ["confirmBeforeExecute", "executeOnLoad"]
   * for Actions/Queries as public, value would depend on plugin's settings
   */
  whitelistedPublicEntitySettingsForModuleInstance: string[];
  type: MODULE_TYPE;
  userPermissions: string[];
}
