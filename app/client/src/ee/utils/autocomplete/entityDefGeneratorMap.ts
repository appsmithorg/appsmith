export * from "ce/utils/autocomplete/entityDefGeneratorMap";
import { entityDefGeneratorMap as CE_entityDefGeneratorMap } from "ce/utils/autocomplete/entityDefGeneratorMap";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import type { EntityDefGeneratorMap } from "ce/utils/autocomplete/entityDefGeneratorMap";
import { generateTypeDef } from "utils/autocomplete/defCreatorUtils";
import type { Def } from "tern";
import { omit } from "lodash";
import { EVALUATION_PATH } from "utils/DynamicBindingUtils";
import {
  isJSModuleInstance,
  isQueryModuleInstance,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import { ModuleInstanceDefMap } from "./EntityDefinitions";
import type {
  ActionEntityConfig,
  JSActionEntityConfig,
  JSModuleInstanceEntity,
  QueryModuleInstanceEntity,
} from "@appsmith/entities/DataTree/types";
import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";

export const entityDefGeneratorMap: EntityDefGeneratorMap = {
  ...CE_entityDefGeneratorMap,
  [ENTITY_TYPE.MODULE_INPUT]: (props) => {
    const { def, entity, entityMap, extraDefsToDefine } = props;
    const filteredEntity = omit(entity, "ENTITY_TYPE", EVALUATION_PATH);
    const inputEntityDef: Def = {};
    Object.entries(filteredEntity).forEach(([inputName, inputValue]) => {
      inputEntityDef[inputName] = generateTypeDef(
        inputValue,
        extraDefsToDefine,
      );
    });

    def["inputs"] = inputEntityDef;

    entityMap.set("inputs", {
      type: ENTITY_TYPE.MODULE_INPUT,
      subType: ENTITY_TYPE.MODULE_INPUT,
    });
  },
  [ENTITY_TYPE.ACTION]: (props) => {
    const { configTree, entityName } = props;
    const entityConfig = configTree[entityName] as ActionEntityConfig;
    const moduleInstanceId = entityConfig["moduleInstanceId"];
    if (!moduleInstanceId) {
      CE_entityDefGeneratorMap[ENTITY_TYPE.ACTION](props);
    }
  },
  [ENTITY_TYPE.JSACTION]: (props) => {
    const { configTree, entityName } = props;
    const entityConfig = configTree[entityName] as JSActionEntityConfig;
    const moduleInstanceId = entityConfig["moduleInstanceId"];
    if (!moduleInstanceId) {
      CE_entityDefGeneratorMap[ENTITY_TYPE.JSACTION](props);
    }
  },
  [ENTITY_TYPE.MODULE_INSTANCE]: (props) => {
    const { def, entity, entityMap, entityName } = props;
    if (isQueryModuleInstance(entity)) {
      const queryEntity = entity as QueryModuleInstanceEntity;
      def[entityName] = ModuleInstanceDefMap[queryEntity.type](props);
      entityMap.set(entityName, {
        type: ENTITY_TYPE.MODULE_INSTANCE,
        subType: MODULE_TYPE.QUERY,
      });
    }
    if (isJSModuleInstance(entity)) {
      const jsEntity = entity as JSModuleInstanceEntity;
      def[entityName] = ModuleInstanceDefMap[jsEntity.type](props);
      entityMap.set(entityName, {
        type: ENTITY_TYPE.MODULE_INSTANCE,
        subType: MODULE_TYPE.JS,
      });
    }
  },
};
