import type { Def } from "tern";
import { generateTypeDef } from "./defCreatorUtils";
import type { AdditionalDynamicDataTree } from "constants/PropertyControlConstants";

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
