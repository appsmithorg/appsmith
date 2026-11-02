import { APP_MODE } from "entities/App";
import type { EventName } from "ee/utils/analyticsUtilTypes";

// High-volume events that cost more in Segment than they return in product insight, even for builders.
const STOPPED_EVENTS: ReadonlySet<string> = new Set([
  "EXECUTE_ACTION_SUCCESS",
  "DEBUGGER_NEW_ERROR",
  "DEBUGGER_NEW_ERROR_MESSAGE",
  "DEBUGGER_RESOLVED_ERROR",
  "DEBUGGER_RESOLVED_ERROR_MESSAGE",
  "ROUTE_CHANGE",
  "PAGE_LOAD",
  "NAVIGATE",
  "SW_REGISTRATION_SUCCESS",
  "SW_REGISTRATION_FAILED",
  "CUSTOM_WIDGET_LOAD_INIT",
  "CUSTOM_WIDGET_API_TRIGGER_EVENT",
  "CUSTOM_WIDGET_API_UPDATE_MODEL",
  "WIDGET_RESIZE_START",
  "WIDGET_RESIZE_END",
  "WIDGET_DRAG",
  "WIDGET_DROP",
  "ENTITY_EXPLORER_CLICK",
  "PEEK_OVERLAY_OPENED",
  "CANVAS_HOVER",
  "AUTO_COMPLETE_SELECT",
  "PAGE_NAME_CLICK",
  "PROPERTY_PANE_KEYPRESS",
  "JS_VARIABLE_CREATED",
  "DATASOURCE_SCHEMA_FETCH",
  "PUBLISH_APP",
  "PAGE_VIEW",
  "PAGES_LIST_LOAD",
  "TIME_TO_NAVIGATE_ENTITY_EXPLORER",
  "CYCLICAL_DEPENDENCY_ERROR",
  "MALFORMED_USAGE_PULSE",
]);

/**
 * Client telemetry is for builders only: anonymous visitors and published-app viewers send nothing,
 * and builders do not send the high-volume events above.
 */
export function shouldTrackEvent(
  eventName: EventName,
  appMode: APP_MODE | undefined,
  isAnonymous: boolean,
): boolean {
  if (isAnonymous) return false;

  if (appMode === APP_MODE.PUBLISHED) return false;

  return !STOPPED_EVENTS.has(eventName);
}
