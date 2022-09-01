import equal from "fast-deep-equal/es6";
import { isEmpty } from "lodash";
import { debug } from "loglevel";
import {
  AdditionalDynamicDataTree,
  customTreeTypeDefCreator,
} from "./customTreeTypeDefCreator";
import TernServer from "./TernServer";

class CustomDef {
  private lastCustomDataDef: AdditionalDynamicDataTree | undefined;

  /**
   * This method is responsible for both add and remove def in TernServer for customDataTree
   * if customData is not defined then
   * @param customData
   */
  update(customData?: AdditionalDynamicDataTree) {
    if (customData && !isEmpty(customData)) {
      const customDataDef = customTreeTypeDefCreator(customData);
      if (!equal(this.lastCustomDataDef, customDataDef)) {
        const start = performance.now();

        TernServer.updateDef("customDataTree", customDataDef);

        debug(
          "Tern: updateDef for customDataTree took",
          (performance.now() - start).toFixed(),
          "ms",
        );

        this.lastCustomDataDef = customDataDef;
      }
    } else if (this.lastCustomDataDef) {
      const start = performance.now();
      TernServer.removeDef("customDataTree");
      debug(
        "Tern: removeDef for customDataTree took",
        (performance.now() - start).toFixed(),
        "ms",
      );
      this.lastCustomDataDef = undefined;
    }
  }
}

export const updateCustomDef = new CustomDef().update;
