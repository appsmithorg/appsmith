import {
  DataTree,
  ENTITY_TYPE,
  MetaArgs,
} from "entities/DataTree/dataTreeFactory";
import { uniqueId, get, isFunction } from "lodash";
import { entityDefinitions } from "utils/autocomplete/EntityDefinitions";
import { getType, Types } from "utils/TypeHelpers";
import { Def } from "tern";
import {
  isAction,
  isAppsmithEntity,
  isJSAction,
  isTrueObject,
  isWidget,
} from "workers/evaluationUtils";
import { DataTreeDefEntityInformation } from "utils/autocomplete/TernServer";

export type ExtraDef = Record<string, Def | string>;

// Def names are encoded with information about the entity
// This so that we have more info about them
// when sorting results in autocomplete
// DATA_TREE.{entityType}.{entitySubType}.{entityName}
// eg DATA_TREE.WIDGET.TABLE_WIDGET_V2.Table1
// or DATA_TREE.ACTION.ACTION.Api1
export const dataTreeTypeDefCreator = (
  dataTree: DataTree,
  isJSEditorEnabled: boolean,
): { def: Def; entityInfo: Map<string, DataTreeDefEntityInformation> } => {
  // When there is a complex data type, we store it in extra def and refer to it in the def
  const extraDefsToDefine: Def = {};

  const def: Def = {
    "!name": "DATA_TREE",
  };
  const entityMap: Map<string, DataTreeDefEntityInformation> = new Map();
  Object.entries(dataTree).forEach(([entityName, entity]) => {
    if (isWidget(entity)) {
      const widgetType = entity.type;
      if (widgetType in entityDefinitions) {
        const definition = get(entityDefinitions, widgetType);
        if (isFunction(definition)) {
          def[entityName] = definition(entity);
        } else {
          def[entityName] = definition;
        }
        flattenDef(def, entityName);
        entityMap.set(entityName, {
          type: ENTITY_TYPE.WIDGET,
          subType: widgetType,
        });
      }
    } else if (isAction(entity)) {
      def[entityName] = entityDefinitions.ACTION(entity, extraDefsToDefine);
      flattenDef(def, entityName);
      entityMap.set(entityName, {
        type: ENTITY_TYPE.ACTION,
        subType: "ACTION",
      });
    } else if (isAppsmithEntity(entity)) {
      def.appsmith = entityDefinitions.APPSMITH(entity);
      entityMap.set("appsmith", {
        type: ENTITY_TYPE.APPSMITH,
        subType: ENTITY_TYPE.APPSMITH,
      });
    } else if (isJSAction(entity) && isJSEditorEnabled) {
      const metaObj: Record<string, MetaArgs> = entity.meta;
      const jsPropertiesDef: Def = {};
      for (const key in metaObj) {
        jsPropertiesDef[key] =
          "fn(onSuccess: fn() -> void, onError: fn() -> void) -> void";
      }

      for (let i = 0; i < entity.variables.length; i++) {
        const varKey = entity.variables[i];
        const varValue = entity[varKey];
        jsPropertiesDef[varKey] = generateTypeDef(varValue);
      }

      def[entityName] = jsPropertiesDef;
      flattenDef(def, entityName);
      entityMap.set(entityName, {
        type: ENTITY_TYPE.JSACTION,
        subType: "JSACTION",
      });
    }
    if (Object.keys(extraDefsToDefine)) {
      def["!define"] = { ...extraDefsToDefine };
    }
  });
  return { def, entityInfo: entityMap };
};

export function generateTypeDef(
  value: unknown,
  extraDefsToDefine?: ExtraDef,
  depth = 0,
): Def | string {
  switch (getType(value)) {
    case Types.ARRAY: {
      const array = value as [unknown];
      if (depth > 4) {
        return `[?]`;
      }
      const arrayType = generateTypeDef(array[0], extraDefsToDefine, depth + 1);
      const uniqueDefName = uniqueId("def_");

      if (extraDefsToDefine) extraDefsToDefine[uniqueDefName] = arrayType;

      return `[${uniqueDefName}]`;
    }
    case Types.OBJECT: {
      const objType: Def = {};
      const object = value as Record<string, unknown>;
      Object.keys(object).forEach((k) => {
        objType[k] = generateTypeDef(object[k], extraDefsToDefine, depth + 1);
      });
      return objType;
    }
    case Types.STRING:
      return "string";
    case Types.NUMBER:
      return "number";
    case Types.BOOLEAN:
      return "bool";
    case Types.NULL:
    case Types.UNDEFINED:
      return "?";
    default:
      return "?";
  }
}

export const flattenDef = (def: Def, entityName: string): Def => {
  const flattenedDef = def;
  if (isTrueObject(def[entityName])) {
    Object.entries(def[entityName]).forEach(([key, value]) => {
      if (!key.startsWith("!")) {
        flattenedDef[`${entityName}.${key}`] = value;
        if (isTrueObject(value)) {
          Object.entries(value).forEach(([subKey, subValue]) => {
            if (!subKey.startsWith("!")) {
              flattenedDef[`${entityName}.${key}.${subKey}`] = subValue;
            }
          });
        }
      }
    });
  }
  return flattenedDef;
};
