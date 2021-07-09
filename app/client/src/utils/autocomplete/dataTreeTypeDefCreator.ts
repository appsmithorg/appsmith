import { DataTreeEntity } from "entities/DataTree/dataTreeFactory";
import _ from "lodash";
import { entityDefinitions } from "utils/autocomplete/EntityDefinitions";
import { getType, Types } from "utils/TypeHelpers";
import { Def } from "tern";
import {
  isAction,
  isAppsmithEntity,
  isTrueObject,
  isWidget,
} from "workers/evaluationUtils";

// When there is a complex data type, we store it in extra def and refer to it
// in the def
let extraDefs: any = {};

// Def names are encoded with information about the entity
// DATA_TREE.{entityType}.{entityName}
// eg DATA_TREE.WIDGET.Table1
export const dataTreeTypeDefCreator = (
  entity: DataTreeEntity,
  entityName: string,
): { def: Def; name: string } => {
  const def: any = {};
  if (isWidget(entity)) {
    const widgetType = entity.type;
    if (widgetType in entityDefinitions) {
      const definition = _.get(entityDefinitions, widgetType);
      if (_.isFunction(definition)) {
        def[entityName] = definition(entity);
      } else {
        def[entityName] = definition;
      }
      flattenDef(def, entityName);
      def["!name"] = `DATA_TREE.WIDGET.${entityName}`;
    }
  } else if (isAction(entity)) {
    def[entityName] = entityDefinitions.ACTION(entity);
    flattenDef(def, entityName);
    def["!name"] = `DATA_TREE.ACTION.${entityName}`;
  } else if (isAppsmithEntity(entity)) {
    def["!name"] = "DATA_TREE.APPSMITH.APPSMITH";
    def.appsmith = generateTypeDef(_.omit(entity, "ENTITY_TYPE"));
  }
  if (Object.keys(extraDefs)) {
    def["!define"] = { ...extraDefs };
    extraDefs = {};
  }
  return { def, name: def["!name"] };
};

export function generateTypeDef(
  obj: any,
): string | Record<string, string | Record<string, unknown>> {
  const type = getType(obj);
  switch (type) {
    case Types.ARRAY: {
      const arrayType = getType(obj[0]);
      return `[${arrayType}]`;
    }
    case Types.OBJECT: {
      const objType: Record<string, string | Record<string, unknown>> = {};
      Object.keys(obj).forEach((k) => {
        objType[k] = generateTypeDef(obj[k]);
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
