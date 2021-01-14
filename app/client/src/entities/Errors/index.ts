import { ReduxAction } from "constants/ReduxActionConstants";

export enum ActionableErrorType {
  UNKNOWN = "unknown",
  EVAL = "eval",
  BINDING_SYNTAX = "binding:syntax",
  BINDING_UNKNOWN_VARIABLE = "binding:unknown_variable",
  BINDING_DISALLOWED_FUNCTION = "binding:disallowed_function",
  ACTION_EXECUTION_TIMEOUT = "action:execution:timeout",
  // add as we need
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

export interface TimelineEvent {
  // "when" did this event happen
  timestamp: Date;
  // "what": Human readable description of what happened.
  message: string;
  // "where" propertyPath / function (widget/action) that triggered this event.
  source: string;
  // "Why" User action or parent that triggered this event.
  // Walking up the parents can be used to construct the timeline/trace of events.
  parent: TimelineEvent | undefined;

  // Snapshot KV pair of scope variables or state associated with this event.
  state: Record<string, any>;
}

/**
 * Example:
 * "User clicked a button -> Triggered an API call -> Api timed out"
 * {
 *   id: 1,
 *   type: ActionableErrorType.ACTION_EXECUTION_TIMEOUT,
 *   severity: ActionableErrorSeverity.ERROR,
 *   message: "Action execution timedout after 10 seconds",
 *   source: "Api1.run",
 *   timestamp: new Date(),
 *   state: {
 *     timeoutMilliseconds: 10000,
 *   },
 *   userActions: [
 *     {
 *       label: "Increase timeout by 5 seconds",
 *       reduxAction: {
 *         type: "ACTION_INCREASE_TIMEOUT",
 *         payload: { actionId: "abcdef", value: 5000 },
 *       },
 *     },
 *   ],
 *   parent: {
 *     message: "Api1 started executing",
 *     source: "Api1.run",
 *     timestamp: new Date(),
 *     parent: {
 *       timestamp: new Date(),
 *       message: "Button1 clicked",
 *       source: "Button1.onClick",
 *       state: {},
 *       parent: undefined,
 *     },
 *     state: {
 *       "Dropdown1.selectedOptionValue": "VEG",
 *     },
 *   }
 * }
 */
export interface ActionableError extends TimelineEvent {
  // Identifier for this particular error, must be globally unique in this run
  // Does not need to be shown to the user.
  id: number;

  // Error type of the event.
  type: ActionableErrorType;

  severity: ActionableErrorSeverity;

  // Actions a user can take to resolve this issue
  userActions: Array<UserAction>;
}
