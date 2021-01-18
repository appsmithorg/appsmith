import { ReduxAction } from "constants/ReduxActionConstants";
import { BindingError } from "entities/Errors/binding";
import { ActionError } from "entities/Errors/action";
import { WidgetError } from "entities/Errors/widget";
import { EvalError } from "entities/Errors/eval";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";

export type ErrorType = BindingError | ActionError | WidgetError | EvalError;

export enum ErrorSeverity {
  // Doesn't break the app, but can cause slowdowns / ux issues/ unexpected behaviour
  WARNING = "warning",
  // Can cause an error in some cases/ single widget, app will work in other cases
  ERROR = "error",
  // Makes the app unusable, can't progress without fixing this.
  CRITICAL = "critical",
}

export type UserAction = {
  // Label is used to display the
  label: string;
  // As there can be multiple errors of the same base type at the same time
  // and we need to be able to tell the difference,
  // these action types should have a dynamic `id` associated with them
  // or we should use JS callback functions instead
  reduxAction: ReduxAction<unknown>;
};

export interface SourceEntity {
  type: ENTITY_TYPE;
  // Widget or action name
  name: string;
  // Id of the widget or action
  id: string;
  // property path of the child
  propertyPath: string;
}

export interface TimelineEvent {
  // "when" did this event happen
  timestamp: Date;
  // "what": Human readable description of what happened.
  message: string;
  // "where" propertyPath / function (widget/action) that triggered this event.
  source: SourceEntity;
  // "Why" User action or parent that triggered this event.
  // Walking back on previous events can be used to construct the timeline/trace of events.
  previous?: TimelineEvent;

  // Snapshot KV pair of scope variables or state associated with this event.
  state: Record<string, any>;
}

/**
 * Example:
 * "User clicked a button -> Triggered an API call -> Api timed out"
 * {
 *   id: 1,
 *   type: ActionError.EXECUTION_TIMEOUT,
 *   timeoutMs: 10000,
 *   severity: ErrorSeverity.ERROR,
 *   message: "Action execution timedout after 10 seconds",
 *   source: {
 *     type: ENTITY_TYPE.ACTION,
 *     name: "Api1",
 *     id: "a12345",
 *     propertyPath: "run",
 *   },
 *   timestamp: new Date(),
 *   state: {},
 *   userActions: [
 *     {
 *       label: "Increase timeout by 5 seconds",
 *       reduxAction: {
 *         type: "ACTION_INCREASE_TIMEOUT",
 *         payload: { actionId: "abcdef", value: 5000 },
 *       },
 *     },
 *   ],
 *   previous: {
 *     message: "Api1 started executing",
 *     source: {
 *       type: ENTITY_TYPE.ACTION,
 *       name: "Api1",
 *       id: "a12345",
 *       propertyPath: "run",
 *     },
 *     timestamp: new Date(),
 *     state: {
 *       "Dropdown1.selectedOptionValue": "VEG",
 *       executionParams: { name: "Piyush" }
 *     },
 *     previous: {
 *       timestamp: new Date(),
 *       message: "Button1 clicked",
 *       source: {
 *         type: ENTITY_TYPE.WIDGET,
 *         name: "Button1",
 *         id: "abcdef",
 *         propertyPath: "onClick",
 *       },
 *       state: {},
 *       previous: undefined,
 *     },
 *   }
 * }
 */
export interface ActionableError extends TimelineEvent {
  // Identifier for this particular error, must be globally unique in this run
  // Does not need to be shown to the user.
  id: number;

  // Error type of the event.
  type: ErrorType;

  severity: ErrorSeverity;

  // Actions a user can take to resolve this issue
  userActions: Array<UserAction>;
}
