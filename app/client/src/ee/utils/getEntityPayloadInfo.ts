export * from "ce/utils/getEntityPayloadInfo";
import {
  ENTITY_TYPE,
  type ModuleInstanceEntityConfig,
} from "@appsmith/entities/DataTree/types";
import { getCurrentModule } from "@appsmith/selectors/entitiesSelector";
import { getModuleInstanceById } from "@appsmith/selectors/moduleInstanceSelectors";
import { getEntityPayloadInfo as CE_getEntityPayloadInfo } from "ce/utils/getEntityPayloadInfo";
import store from "store";

export const getEntityPayloadInfo: typeof CE_getEntityPayloadInfo = {
  ...CE_getEntityPayloadInfo,
  [ENTITY_TYPE.MODULE_INPUT]: () => {
    const currentModule = getCurrentModule(store.getState());
    return {
      iconId: currentModule.type,
      id: currentModule.id,
    };
  },
  [ENTITY_TYPE.MODULE_INSTANCE]: (entityConfig) => {
    const config = entityConfig as ModuleInstanceEntityConfig;
    const moduleInstance = getModuleInstanceById(
      store.getState(),
      config.moduleInstanceId,
    );
    return {
      iconId: config.type,
      id: config.moduleInstanceId,
      entityName: moduleInstance?.name,
    };
  },
  [ENTITY_TYPE.WIDGET]: (entityConfig) => {
    return CE_getEntityPayloadInfo[ENTITY_TYPE.WIDGET](entityConfig);
  },
  [ENTITY_TYPE.JSACTION]: (entityConfig) => {
    const payloadInfo =
      CE_getEntityPayloadInfo[ENTITY_TYPE.JSACTION](entityConfig);

    const config = entityConfig as ModuleInstanceEntityConfig;
    if (!config.moduleInstanceId) return payloadInfo;
    const moduleInstance = getModuleInstanceById(
      store.getState(),
      config.moduleInstanceId,
    );
    payloadInfo.entityName = moduleInstance?.name;
    return payloadInfo;
  },
  [ENTITY_TYPE.ACTION]: (entityConfig) => {
    const payloadInfo =
      CE_getEntityPayloadInfo[ENTITY_TYPE.ACTION](entityConfig);

    const config = entityConfig as ModuleInstanceEntityConfig;
    if (!config.moduleInstanceId) return payloadInfo;
    const moduleInstance = getModuleInstanceById(
      store.getState(),
      config.moduleInstanceId,
    );

    payloadInfo.entityName = moduleInstance?.name;
    return payloadInfo;
  },
};
