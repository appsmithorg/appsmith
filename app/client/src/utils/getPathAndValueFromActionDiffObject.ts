import * as Sentry from "@sentry/react";

//Following function is the fix for the missing where key
/**
 * NOTE:
 * Action object returned by getAction comes from state.entities.action
 * action api's payload is created from state.entities.action and response is saved in the same key
 * Data passed to redux form is the merge of values present in state.entities.action, editorConfig, settingsConfig and has the correct datastrucure
 * Data structure in state.entities.action is not correct
 * Q. What does the following fix do?
 * A. It calculates the diff between merged values and state.entities.action and saves the same in state.entities.action
 * There is another key form that holds the formData
 */
export function getPathAndValueFromActionDiffObject(actionObjectDiff: any) {
  if (!actionObjectDiff) {
    return {
      path: undefined,
      value: undefined,
    };
  } else {
    let path = "";
    let value = "";
    // Loop through the diff objects in difference Array
    for (let i = 0; i < actionObjectDiff.length; i++) {
      //kind = N indicates a newly added property/element
      //This property is present in initialValues but not in action object
      if (
        actionObjectDiff &&
        actionObjectDiff[i].hasOwnProperty("kind") &&
        actionObjectDiff[i].path &&
        Array.isArray(actionObjectDiff[i].path) &&
        actionObjectDiff[i].path.length &&
        actionObjectDiff[i]?.kind === "N"
      ) {
        // Calculate path from path[] in diff
        path = actionObjectDiff[i].path.reduce(
          (acc: string, item: number | string) => {
            try {
              if (typeof item === "string" && acc) {
                acc += `${path}.${item}`;
              } else if (typeof item === "string" && !acc) {
                acc += `${item}`;
              } else acc += `${path}[${item}]`;
              return acc;
            } catch (error) {
              Sentry.captureException({
                message: `Adding key: where failed, cannot create path`,
                oldData: actionObjectDiff,
              });
            }
          },
          "",
        );
        // get value from diff object
        value = actionObjectDiff[i]?.rhs;
      }
      return { path, value };
    }
  }
}
