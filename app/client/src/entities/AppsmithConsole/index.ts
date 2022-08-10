import { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import LOG_TYPE from "./logtype";
import { PropertyEvaluationErrorType } from "utils/DynamicBindingUtils";

export enum ENTITY_TYPE {
  ACTION = "ACTION",
  DATASOURCE = "DATASOURCE",
  WIDGET = "WIDGET",
  JSACTION = "JSACTION",
}

export enum PLATFORM_ERROR {
  PLUGIN_EXECUTION = "PLUGIN_EXECUTION",
  JS_FUNCTION_EXECUTION = "JS_FUNCTION_EXECUTION",
}

export type ErrorType = PropertyEvaluationErrorType | PLATFORM_ERROR;

export enum Severity {
  // Everything, irrespective of what the user should see or not
  // DEBUG = "debug",
  // Something the dev user should probably know about
  INFO = "info",
  // Doesn't break the app, but can cause slowdowns / ux issues/ unexpected behaviour
  WARNING = "warning",
  // Can cause an error in some cases/ single widget, app will work in other cases
  ERROR = "error",
  // Makes the app unusable, can't progress without fixing this.
  // CRITICAL = "critical",
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
  propertyPath?: string;
}

export interface LogActionPayload {
  // Log id, used for updating or deleting
  id?: string;
  // What is the log about. Is it a datasource update, widget update, eval error etc.
  logType?: LOG_TYPE;
  text: string;
  messages?: Array<Message>;
  // Time taken for the event to complete
  timeTaken?: string;
  // "where" source entity and propertyPsath.
  source?: SourceEntity;
  // Snapshot KV pair of scope variables or state associated with this event.
  state?: Record<string, any>;
  // Any other data required for analytics
  analytics?: Record<string, any>;
}

export interface Message {
  // More contextual message than `text`
  message: string;
  type?: ErrorType;
  subType?: string;
  // The section of code being referred to
  // codeSegment?: string;
}

export interface Log extends LogActionPayload {
  severity: Severity;
  // "when" did this event happen
  timestamp: string;
}

/**
 * Example:
 * "Api timed out"
 * {
 *   type: ActionError.EXECUTION_TIMEOUT,
 *   timeoutMs: 10000,
 *   severity: Severity.ERROR,
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
 *   ]
 * }
 */
