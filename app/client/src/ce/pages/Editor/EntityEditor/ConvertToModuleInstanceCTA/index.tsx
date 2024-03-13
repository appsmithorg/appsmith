import type { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";
import type { PluginId } from "api/PluginApi";
import type { PluginType } from "entities/Action";

export interface ConvertToModuleInstanceCTAProps {
  entityId: string;
  moduleType: MODULE_TYPE;
  canDeleteEntity: boolean;
  canCreateModuleInstance: boolean;
  pluginId: PluginId;
  pluginType?: PluginType;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ConvertToModuleInstanceCTA(props: ConvertToModuleInstanceCTAProps) {
  return null;
}

export default ConvertToModuleInstanceCTA;
