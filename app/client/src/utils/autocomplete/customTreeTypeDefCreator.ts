import { generateReactKey } from "utils/generators";
import { getType, Types } from "utils/TypeHelpers";

let extraDefs: any = {};

export const customTreeTypeDefCreator = (
  dataTree: Record<string, Record<string, unknown>>,
) => {
  const def: any = {
    "!name": "customDataTree",
  };
  Object.keys(dataTree).forEach((entityName) => {
    const entity = dataTree[entityName];
    def[entityName] = generateTypeDef(entity);
  });
  def["!define"] = { ...extraDefs };
  extraDefs = {};
  return { ...def };
};

export function generateTypeDef(
  obj: any,
): string | Record<string, string | Record<string, unknown>> {
  const type = getType(obj);
  switch (type) {
    case Types.ARRAY: {
      const arrayType = generateTypeDef(obj[0]);
      const name = generateReactKey();
      extraDefs[name] = arrayType;
      return `[${name}]`;
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
