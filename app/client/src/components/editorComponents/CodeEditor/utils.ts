import { DataTree } from "entities/DataTree/dataTreeFactory";
import { EVALUATION_PATH } from "utils/DynamicBindingUtils";
import { isJSAction } from "workers/evaluationUtils";

export const getJSObjectProperty = ({
  dataTreeForAutoComplete,
  JSObjectName,
}: {
  dataTreeForAutoComplete: DataTree;
  JSObjectName: string;
}) => {
  const JSObjectEntity = dataTreeForAutoComplete[JSObjectName];
  let JSobject = {};

  if (isJSAction(JSObjectEntity)) {
    const variables = JSObjectEntity[EVALUATION_PATH].evaluatedValues;
    const metaObj = JSObjectEntity.meta;
    const jsFunctions: Record<string, () => null> = {};
    Object.keys(metaObj).forEach((functionName) => {
      jsFunctions[functionName] = function() {
        return null;
      };
    });
    JSobject = {
      ...variables,
      ...jsFunctions,
    };
  }
  return JSobject;
};
