import type { DataTreeEntityObject } from "@appsmith/entities/DataTree/types";
import type { EntityMap } from "@appsmith/utils/autocomplete/entityDefGeneratorMap";
import { entityDefGeneratorMap } from "@appsmith/utils/autocomplete/entityDefGeneratorMap";
import type { ConfigTree, DataTree } from "entities/DataTree/dataTreeTypes";
import type { Def } from "tern";
import { type ExtraDef, generateTypeDef } from "./defCreatorUtils";

// Def names are encoded with information about the entity
// This so that we have more info about them
// when sorting results in autocomplete
// DATA_TREE.{entityType}.{entitySubType}.{entityName}
// eg DATA_TREE.WIDGET.TABLE_WIDGET_V2.Table1
// or DATA_TREE.ACTION.ACTION.Api1
export const dataTreeTypeDefCreator = (
  dataTree: DataTree,
  jsData: Record<string, unknown> = {},
  configTree: ConfigTree,
): { def: Def; entityInfo: EntityMap } => {
  // When there is a complex data type, we store it in extra def and refer to it in the def
  const extraDefsToDefine: Def = {};

  const def: Def = {
    "!name": "DATA_TREE",
  };
  const entityMap: EntityMap = new Map();

  Object.entries(dataTree).forEach(([entityName, entity]) => {
    const entityType = (entity as DataTreeEntityObject).ENTITY_TYPE;
    if (entityType && entityDefGeneratorMap[entityType]) {
      entityDefGeneratorMap[entityType]({
        entity,
        configTree,
        entityName,
        extraDefsToDefine,
        entityMap,
        def,
        jsData,
      });
    } else if (entityName === "params") {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      def["params"] = generateParamsDef(entity, extraDefsToDefine);
    }
  });

  if (Object.keys(extraDefsToDefine)) {
    def["!define"] = { ...extraDefsToDefine };
  }

  return { def, entityInfo: entityMap };
};

function generateParamsDef(
  params: Record<string, unknown>,
  extraDefsToDefine: ExtraDef,
) {
  const inputEntityDef: Def = {};
  Object.entries(params).forEach(([inputName, inputValue]) => {
    inputEntityDef[inputName] = generateTypeDef(inputValue, extraDefsToDefine);
  });

  return inputEntityDef;
}
