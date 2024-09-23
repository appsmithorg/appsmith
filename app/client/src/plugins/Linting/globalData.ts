import type { ConfigTree, DataTree } from "entities/DataTree/dataTreeTypes";
import { isEmpty } from "lodash";
import type { EvalContext } from "workers/Evaluation/evaluate";
import { getEvaluationContext } from "./utils/getEvaluationContext";

class GlobalData {
  globalDataWithFunctions: EvalContext = {};
  globalDataWithoutFunctions: EvalContext = {};
  unevalTree: DataTree = {};
  configTree: ConfigTree = {};
  cloudHosting = false;

  initialize(
    unevalTree: DataTree,
    configTree: ConfigTree,
    cloudHosting: boolean,
  ) {
    this.globalDataWithFunctions = {};
    this.globalDataWithoutFunctions = {};
    this.unevalTree = unevalTree;
    this.configTree = configTree;
    this.cloudHosting = cloudHosting;
  }

  getGlobalData(withFunctions: boolean) {
    // Our goal is to create global data (with or without functions) only once during a linting cycle
    if (withFunctions) {
      if (isEmpty(this.globalDataWithFunctions)) {
        this.globalDataWithFunctions = getEvaluationContext(
          this.unevalTree,
          this.configTree,
          this.cloudHosting,
          {
            withFunctions: true,
          },
        );
      }

      return this.globalDataWithFunctions;
    } else {
      if (isEmpty(this.globalDataWithoutFunctions)) {
        this.globalDataWithoutFunctions = getEvaluationContext(
          this.unevalTree,
          this.configTree,
          this.cloudHosting,
          {
            withFunctions: false,
          },
        );
      }

      return this.globalDataWithoutFunctions;
    }
  }
}

export const globalData = new GlobalData();
