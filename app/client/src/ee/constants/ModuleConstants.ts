type ID = string;

export type ModuleInput = {
  name: string;
  defaultValue?: string;
};

export type Module = {
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
};
