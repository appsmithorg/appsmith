import equal from "fast-deep-equal/es6";
import {
  AdditionalDynamicDataTree,
  customTreeTypeDefCreator,
} from "./customTreeTypeDefCreator";
import TernServer from "./TernServer";

let lastCustomData: AdditionalDynamicDataTree | undefined;

export const updateCustomDef = (customData?: AdditionalDynamicDataTree) => {
  if (customData) {
    if (!equal(lastCustomData, customData)) {
      const customDataDef = customTreeTypeDefCreator(customData);
      TernServer.updateDef("customDataTree", [customDataDef]);
      lastCustomData = customData;
    }
  } else {
    TernServer.updateDef("customDataTree");
    lastCustomData = undefined;
  }
};
