import { DataTree, ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import _ from "lodash";
import { generateReactKey } from "utils/generators";
import {
  entityDefinitions,
  GLOBAL_DEFS,
  GLOBAL_FUNCTIONS,
} from "utils/autocomplete/EntityDefinitions";
import { getType, Types } from "utils/TypeHelpers";

let extraDefs: any = {};

export const dataTreeTypeDefCreator = (dataTree: DataTree) => {
  const def: any = {
    "!name": "dataTree",
  };
  Object.keys(dataTree).forEach(entityName => {
    const entity = dataTree[entityName];
    if ("ENTITY_TYPE" in entity) {
      if (entity.ENTITY_TYPE === ENTITY_TYPE.WIDGET) {
        const widgetType = entity.type;
        if (widgetType in entityDefinitions) {
          const definition = _.get(entityDefinitions, widgetType);
          if (_.isFunction(definition)) {
            def[entityName] = definition(entity);
          } else {
            def[entityName] = definition;
          }
        }
      }
      if (entity.ENTITY_TYPE === ENTITY_TYPE.ACTION) {
        def[entityName] = entityDefinitions.ACTION(entity);
      }
      if (entity.ENTITY_TYPE === ENTITY_TYPE.APPSMITH) {
        def.appsmith = generateTypeDef(_.omit(entity, "ENTITY_TYPE"));
      }
    }
  });
  def["!define"] = { ...GLOBAL_DEFS, ...extraDefs };
  extraDefs = {};
  return { ...def, ...GLOBAL_FUNCTIONS };
};

export function generateTypeDef(
  obj: any,
): string | Record<string, string | object> {
  const type = getType(obj);
  switch (type) {
    case Types.ARRAY: {
      const arrayType = generateTypeDef(obj[0]);
      const name = generateReactKey();
      extraDefs[name] = arrayType;
      return `[${name}]`;
    }
    case Types.OBJECT: {
      const objType: Record<string, string | object> = {};
      Object.keys(obj).forEach(k => {
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
