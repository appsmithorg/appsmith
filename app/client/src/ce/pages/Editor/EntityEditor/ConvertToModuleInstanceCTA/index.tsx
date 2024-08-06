import type { MODULE_TYPE } from "ee/constants/ModuleConstants";

export interface ConvertToModuleInstanceCTAProps {
  entityId: string;
  moduleType: MODULE_TYPE;
  canDeleteEntity: boolean;
  canCreateModuleInstance: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ConvertToModuleInstanceCTA(props: ConvertToModuleInstanceCTAProps) {
  return null;
}

export default ConvertToModuleInstanceCTA;
