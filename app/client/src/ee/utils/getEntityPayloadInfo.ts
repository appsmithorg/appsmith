export * from "ce/utils/getEntityPayloadInfo";
import {
  ENTITY_TYPE,
  type EntityConfig,
} from "@appsmith/entities/DataTree/types";
import { getCurrentModule } from "@appsmith/selectors/entitiesSelector";
import { getEntityPayloadInfo as CE_getEntityPayloadInfo } from "ce/utils/getEntityPayloadInfo";
import type { PluginType } from "entities/Action";
import store from "store";

export const getEntityPayloadInfo: Record<
  string,
  (entityConfig: EntityConfig) => {
    iconId: string;
    id: string;
    pluginType?: PluginType;
  }
> = {
  ...CE_getEntityPayloadInfo,
  [ENTITY_TYPE.MODULE_INPUT]: () => {
    const currentModule = getCurrentModule(store.getState());
    return {
      iconId: currentModule.type,
      id: currentModule.id,
    };
  },
};
