export * from "ce/utils/autocomplete/entityDefGeneratorMap";
import { entityDefGeneratorMap as CE_entityDefGeneratorMap } from "ce/utils/autocomplete/entityDefGeneratorMap";
import { ENTITY_TYPE_VALUE } from "entities/DataTree/dataTreeFactory";
import type { EntityDefGeneratorMap } from "ce/utils/autocomplete/entityDefGeneratorMap";
import { generateTypeDef } from "utils/autocomplete/defCreatorUtils";
import type { Def } from "tern";
import { omit } from "lodash";
import { EVALUATION_PATH } from "utils/DynamicBindingUtils";

export const entityDefGeneratorMap: EntityDefGeneratorMap = {
  ...CE_entityDefGeneratorMap,
  [ENTITY_TYPE_VALUE.MODULE_INPUT]: (props) => {
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
      type: ENTITY_TYPE_VALUE.MODULE_INPUT,
      subType: ENTITY_TYPE_VALUE.MODULE_INPUT,
    });
  },
};
