import { TruthyPrimitiveTypes } from "utils/TypeHelpers";
import { generateTypeDef } from "./dataTreeTypeDefCreator";

let extraDefs: any = {};

export const customTreeTypeDefCreator = (
  dataTree: Record<string, Record<string, unknown> | TruthyPrimitiveTypes>,
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
