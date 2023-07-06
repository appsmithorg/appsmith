import type { DataTree } from "entities/DataTree/dataTreeFactory";
import { isEmpty } from "lodash";
import type { EvalContext } from "workers/Evaluation/evaluate";
import getEvaluationContext from "./utils/getEvaluationContext";

class GlobalData {
  globalDataWithFunctions: EvalContext = {};
  globalDataWithoutFunctions: EvalContext = {};
  unevalTree: DataTree = {};
  cloudHosting = false;

  initialize(unevalTree: DataTree, cloudHosting: boolean) {
    this.globalDataWithFunctions = {};
    this.globalDataWithoutFunctions = {};
    this.unevalTree = unevalTree;
    this.cloudHosting = cloudHosting;
  }

  getGlobalData(withFunctions: boolean) {
    // Our goal is to create global data (with or without functions) only once during a linting cycle
    if (withFunctions) {
      if (isEmpty(this.globalDataWithFunctions)) {
        this.globalDataWithFunctions = getEvaluationContext(
          this.unevalTree,
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
