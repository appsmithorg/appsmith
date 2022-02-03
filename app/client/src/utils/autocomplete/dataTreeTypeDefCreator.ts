import {
  DataTree,
  ENTITY_TYPE,
  MetaArgs,
} from "entities/DataTree/dataTreeFactory";
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
import { DataTreeDefEntityInformation } from "utils/autocomplete/TernServer";
import getFeatureFlags from "utils/featureFlags";
// When there is a complex data type, we store it in extra def and refer to it
// in the def
let extraDefs: any = {};
// Def names are encoded with information about the entity
// This so that we have more info about them
// when sorting results in autocomplete
// DATA_TREE.{entityType}.{entitySubType}.{entityName}
// eg DATA_TREE.WIDGET.TABLE_WIDGET.Table1
// or DATA_TREE.ACTION.ACTION.Api1
export const dataTreeTypeDefCreator = (
  dataTree: DataTree,
): { def: Def; entityInfo: Map<string, DataTreeDefEntityInformation> } => {
  const def: any = {
    "!name": "DATA_TREE",
  };
  const entityMap: Map<string, DataTreeDefEntityInformation> = new Map();
  const isJSEditorEnabled = getFeatureFlags().JS_EDITOR;
  Object.entries(dataTree).forEach(([entityName, entity]) => {
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
        entityMap.set(entityName, {
          type: ENTITY_TYPE.WIDGET,
          subType: widgetType,
        });
      }
    } else if (isAction(entity)) {
      def[entityName] = (entityDefinitions.ACTION as any)(entity);
      flattenDef(def, entityName);
      entityMap.set(entityName, {
        type: ENTITY_TYPE.ACTION,
        subType: "ACTION",
      });
    } else if (isAppsmithEntity(entity)) {
      def.appsmith = (entityDefinitions.APPSMITH as any)(entity);
      entityMap.set("appsmith", {
        type: ENTITY_TYPE.APPSMITH,
        subType: ENTITY_TYPE.APPSMITH,
      });
    } else if (isJSAction(entity) && isJSEditorEnabled) {
      const metaObj: Record<string, MetaArgs> = entity.meta;
      const jsOptions: Record<string, unknown> = {};
      for (const key in metaObj) {
        jsOptions[key] =
          "fn(onSuccess: fn() -> void, onError: fn() -> void) -> void";
      }

      for (let i = 0; i < entity.variables.length; i++) {
        const varKey = entity.variables[i];
        const varValue = entity[varKey];
        jsOptions[varKey] = generateTypeDef(varValue);
      }

      def[entityName] = jsOptions;
      flattenDef(def, entityName);
      entityMap.set(entityName, {
        type: ENTITY_TYPE.JSACTION,
        subType: "JSACTION",
      });
    }
    if (Object.keys(extraDefs)) {
      def["!define"] = { ...extraDefs };
      extraDefs = {};
    }
  });
  return { def, entityInfo: entityMap };
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
