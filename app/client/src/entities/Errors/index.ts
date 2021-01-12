import { ReduxAction } from "constants/ReduxActionConstants";

export enum ActionableErrorType {
  UNKNOWN = "unknown",
  EVAL = "eval",
  BINDING = "binding",
}

export enum ActionableErrorSeverity {
  // Doesn't break the app, but can cause slowdowns / ux issues/ unexpected behaviour
  WARNING = "warning",
  // Can cause an error in some cases/ single widget, app will work in other cases
  ERROR = "error",
  // Makes the app unusable, can't progress without fixing this.
  CRITICAL = "critical",
}

export type UserAction = {
  // Label may or may not need formatting
  label: string;
  // As there can be multiple errors of the same base type at the same time
  // and we need to be able to tell the difference,
  // these action types should have a dynamic `id` associated with them
  // or we should use JS callback functions instead
  reduxAction: ReduxAction<unknown>;
};

export type ActionableError = {
  // Message will need formatting to highlight what exactly is broken.
  // Do we want to add clickable elements?
  // Eg: clicking `Table1.tableData` will take you to the propertyPane of `Table1` and focus on the `Data`
  // If yes, string might not be the correct type here.
  message: string;
  // Should we have a more open system of error codes that people can define and handle?
  type: ActionableErrorType;
  severity: ActionableErrorSeverity;
  userActions: Array<UserAction>;
  // Not completely sure of this,
  // If this error occured as a result of another, we can use this to link to the parent
  // Might help group errors in a flow and help user figure out what happened.
  parent?: ActionableError;
};
