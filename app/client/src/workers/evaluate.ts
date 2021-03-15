import { ActionDescription, DataTree } from "entities/DataTree/dataTreeFactory";
import { addFunctions } from "workers/evaluationUtils";
import _ from "lodash";
import {
  extraLibraries,
  unsafeFunctionForEval,
} from "utils/DynamicBindingUtils";
import unescapeJS from "unescape-js";

export type EvalResult = {
  result: any;
  triggers?: ActionDescription<any>[];
};

export default function evaluate(
  js: string,
  data: DataTree,
  callbackData?: Array<any>,
): EvalResult {
  const unescapedJS = unescapeJS(js).replace(/(\r\n|\n|\r)/gm, "");
  const scriptToEvaluate = `
        function closedFunction () {
          const result = ${unescapedJS};
          return { result, triggers: self.triggers }
        }
        closedFunction()
      `;
  const scriptWithCallback = `
         function callback (script) {
            const userFunction = script;
            const result = userFunction.apply(self, CALLBACK_DATA);
            return { result, triggers: self.triggers };
         }
         callback(${unescapedJS});
      `;
  const script = callbackData ? scriptWithCallback : scriptToEvaluate;
  const { result, triggers } = (function() {
    /**** Setting the eval context ****/
    const GLOBAL_DATA: Record<string, any> = {};
    ///// Adding callback data
    GLOBAL_DATA.CALLBACK_DATA = callbackData;
    //// Add internal functions to dataTree;
    const dataTreeWithFunctions = addFunctions(data);
    ///// Adding Data tree
    Object.keys(dataTreeWithFunctions).forEach((datum) => {
      GLOBAL_DATA[datum] = dataTreeWithFunctions[datum];
    });
    ///// Fixing action paths and capturing their execution response
    if (dataTreeWithFunctions.actionPaths) {
      GLOBAL_DATA.triggers = [];
      const pusher = function(this: DataTree, action: any, ...payload: any[]) {
        const actionPayload = action(...payload);
        GLOBAL_DATA.triggers.push(actionPayload);
      };
      GLOBAL_DATA.actionPaths.forEach((path: string) => {
        const action = _.get(GLOBAL_DATA, path);
        const entity = _.get(GLOBAL_DATA, path.split(".")[0]);
        if (action) {
          _.set(GLOBAL_DATA, path, pusher.bind(data, action.bind(entity)));
        }
      });
    }

    // Set it to self so that the eval function can have access to it
    // as global data. This is what enables access all appsmith
    // entity properties from the global context
    Object.keys(GLOBAL_DATA).forEach((key) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: No types available
      self[key] = GLOBAL_DATA[key];
    });

    ///// Adding extra libraries separately
    extraLibraries.forEach((library) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: No types available
      self[library.accessor] = library.lib;
    });

    ///// Remove all unsafe functions
    unsafeFunctionForEval.forEach((func) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: No types available
      self[func] = undefined;
    });

    const evalResult = eval(script);

    // Remove it from self
    // This is needed so that next eval can have a clean sheet
    Object.keys(GLOBAL_DATA).forEach((key) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: No types available
      delete self[key];
    });

    return evalResult;
  })();
  return { result, triggers };
}
