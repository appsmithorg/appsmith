import { Def } from "tern";
import { TruthyPrimitiveTypes } from "utils/TypeHelpers";
import { generateTypeDef } from "./dataTreeTypeDefCreator";

export type AdditionalDynamicDataTree = Record<
  string,
  Record<string, unknown> | TruthyPrimitiveTypes
>;

export const customTreeTypeDefCreator = (data: AdditionalDynamicDataTree) => {
  const extraDefsToDefine: Def = {};
  const def: Def = {
    "!name": "customDataTree",
  };
  Object.keys(data).forEach((keyName) => {
    const entity = data[keyName];
    def[keyName] = generateTypeDef(entity, extraDefsToDefine);
  });
  def["!define"] = { ...extraDefsToDefine };

  return { ...def };
};
