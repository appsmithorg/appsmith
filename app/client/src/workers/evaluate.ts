import { ActionDescription, DataTree } from "entities/DataTree/dataTreeFactory";
import { addFunctions } from "workers/evaluationUtils";
import _ from "lodash";
import {
  extraLibraries,
  unsafeFunctionForEval,
} from "utils/DynamicBindingUtils";
import unescapeJS from "unescape-js";
import { JSHINT as jshint, LintError } from "jshint";

export type EvalResult = {
  result: any;
  triggers?: ActionDescription<any>[];
  errors: {
    linting?: LintError[];
    evaluating?: string;
  };
};

export enum EvaluationScriptType {
  EXPRESSION = "EXPRESSION",
  ANONYMOUS_FUNCTION = "ANONYMOUS_FUNCTION",
}

const evaluationScripts: Record<
  EvaluationScriptType,
  (script: string) => string
> = {
  [EvaluationScriptType.EXPRESSION]: (script: string) => `return ${script}`,
  [EvaluationScriptType.ANONYMOUS_FUNCTION]: (script) =>
    `const userFunction = ${script}
    return userFunction.apply(self, ARGUMENTS)`,
};

const getScriptToEval = (userScript: string, evalArguments?: Array<any>) => {
  return evalArguments
    ? evaluationScripts[EvaluationScriptType.ANONYMOUS_FUNCTION](userScript)
    : evaluationScripts[EvaluationScriptType.EXPRESSION](userScript);
};

const getLintingErrors = (script: string) => {
  jshint(script, {
    esversion: 7,
    eqeqeq: true,
    curly: true,
    freeze: true,
    undef: true,
    unused: true,
    asi: true,
    worker: true,
  });

  return jshint.errors;
};

export default function evaluate(
  js: string,
  data: DataTree,
  evalArguments?: Array<any>,
): EvalResult {
  const unescapedJS = unescapeJS(js);
  const script = getScriptToEval(unescapedJS, evalArguments);
  const lintErrors = getLintingErrors(script);
  console.log({ lintErrors });

  const { result, triggers } = (function() {
    /**** Setting the eval context ****/
    const GLOBAL_DATA: Record<string, any> = {};
    ///// Adding callback data
    GLOBAL_DATA.ARGUMENTS = evalArguments;
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
    debugger;
    const result = Function(script)();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const triggers = [...self.triggers];

    // Remove it from self
    // This is needed so that next eval can have a clean sheet
    Object.keys(GLOBAL_DATA).forEach((key) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: No types available
      delete self[key];
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return { result, triggers };
  })();
  return {
    result,
    triggers,
    errors: { linting: lintErrors },
  };
}
