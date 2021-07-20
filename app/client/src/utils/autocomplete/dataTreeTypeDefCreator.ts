import { DataTreeEntity } from "entities/DataTree/dataTreeFactory";
import _ from "lodash";
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

// When there is a complex data type, we store it in extra def and refer to it
// in the def
let extraDefs: any = {};
export const skipJSProps = [
  "ENTITY_TYPE",
  "name",
  "meta",
  "body",
  "pluginType",
  "dynamicBindingPathList",
  "bindingPaths",
  "actionId",
  "__evaluation__",
  "variables",
];

// Def names are encoded with information about the entity
// This so that we have more info about them
// when sorting results in autocomplete
// DATA_TREE.{entityType}.{entitySubType}.{entityName}
// eg DATA_TREE.WIDGET.TABLE_WIDGET.Table1
// or DATA_TREE.ACTION.ACTION.Api1
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
      def["!name"] = `DATA_TREE.WIDGET.${widgetType}.${entityName}`;
    }
  } else if (isAction(entity)) {
    def[entityName] = entityDefinitions.ACTION(entity);
    flattenDef(def, entityName);
    def["!name"] = `DATA_TREE.ACTION.ACTION.${entityName}`;
  } else if (isAppsmithEntity(entity)) {
    def["!name"] = "DATA_TREE.APPSMITH.APPSMITH";
    def.appsmith = generateTypeDef(_.omit(entity, "ENTITY_TYPE"));
  } else if (isJSAction(entity)) {
    const result: any = _.omit(entity, skipJSProps);
    const metaObj: any = entity.meta;
    const jsOptions: any = {};
    for (const key in metaObj) {
      jsOptions[key] =
        "fn(onSuccess: fn() -> void, onError: fn() -> void) -> void";
    }
    for (const key in result) {
      jsOptions[key] = generateTypeDef(entity[key]);
    }
    def[entityName] = jsOptions;
    const flattenedjsObjects = flattenDef(jsOptions, entityName);
    for (const [key, value] of Object.entries(flattenedjsObjects)) {
      def[key] = value;
    }
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

export const getPropsForJSActionEntity = (entity: any): any => {
  const result: any = {};
  const metaObj = entity.meta;
  for (const key in metaObj) {
    if (metaObj.hasOwnProperty(key)) {
      result[key] =
        "fn(onSuccess: fn() -> void, onError: fn() -> void) -> void";
    }
  }
  const dataObj = entity.data;
  for (const key in dataObj) {
    if (dataObj.hasOwnProperty(key)) {
      result["data." + key] = dataObj[key];
    }
  }
  const variables = entity.variables;
  if (variables.length > 0) {
    for (let i = 0; i < variables.length; i++) {
      result[variables[i]] = entity[variables[i]];
    }
  }
  return result;
};
