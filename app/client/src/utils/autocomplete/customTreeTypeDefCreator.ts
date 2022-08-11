import { Def } from "tern";
import { TruthyPrimitiveTypes } from "utils/TypeHelpers";
import { generateTypeDef } from "./dataTreeTypeDefCreator";

let extraDefs: any = {};

export type AdditionalDynamicDataTree = Record<
  string,
  Record<string, unknown> | TruthyPrimitiveTypes
>;

export const customTreeTypeDefCreator = (
  dataTree: AdditionalDynamicDataTree,
) => {
  const def: Def = {
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
