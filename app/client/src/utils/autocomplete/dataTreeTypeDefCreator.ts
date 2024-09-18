import type { DataTreeEntityObject } from "ee/entities/DataTree/types";
import type { EntityMap } from "ee/utils/autocomplete/entityDefGeneratorMap";
import { entityDefGeneratorMap } from "ee/utils/autocomplete/entityDefGeneratorMap";
import type { ConfigTree, DataTree } from "entities/DataTree/dataTreeTypes";
import type { Def } from "tern";

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
    }
  });

  if (Object.keys(extraDefsToDefine)) {
    def["!define"] = { ...extraDefsToDefine };
  }

  return { def, entityInfo: entityMap };
};
