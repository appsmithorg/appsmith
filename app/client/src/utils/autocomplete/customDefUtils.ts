import equal from "fast-deep-equal/es6";
import { isEmpty } from "lodash";
import { debug } from "loglevel";
import {
  AdditionalDynamicDataTree,
  customTreeTypeDefCreator,
} from "./customTreeTypeDefCreator";
import TernServer from "./TernServer";

let lastCustomDataDef: AdditionalDynamicDataTree | undefined;

export const updateCustomDef = (customData?: AdditionalDynamicDataTree) => {
  if (customData && !isEmpty(customData)) {
    const customDataDef = customTreeTypeDefCreator(customData);
    if (!equal(lastCustomDataDef, customDataDef)) {
      const start = performance.now();

      TernServer.updateDef("customDataTree", customDataDef);

      debug(
        "Tern: updateDef for customDataTree took",
        (performance.now() - start).toFixed(),
        "ms",
      );

      lastCustomDataDef = customDataDef;
    }
  } else if (lastCustomDataDef) {
    const start = performance.now();
    TernServer.removeDef("customDataTree");
    debug(
      "Tern: removeDef for customDataTree took",
      (performance.now() - start).toFixed(),
      "ms",
    );
    lastCustomDataDef = undefined;
  }
};
