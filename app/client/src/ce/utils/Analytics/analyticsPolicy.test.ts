import { APP_MODE } from "entities/App";
import type { EventName } from "ee/utils/analyticsUtilTypes";
import { shouldTrackEvent } from "ee/utils/Analytics/analyticsPolicy";

const STOPPED_EVENTS = [
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
];

const KEPT_EVENT: EventName = "WIDGET_PROPERTY_UPDATE";

describe("shouldTrackEvent", () => {
  it.each(STOPPED_EVENTS)(
    "drops %s even for a builder in the editor",
    (name) => {
      expect(shouldTrackEvent(name as EventName, APP_MODE.EDIT, false)).toBe(
        false,
      );
    },
  );

  it("keeps a builder event in the editor", () => {
    expect(shouldTrackEvent(KEPT_EVENT, APP_MODE.EDIT, false)).toBe(true);
  });

  it("keeps a builder event outside an app, where there is no app mode", () => {
    expect(shouldTrackEvent(KEPT_EVENT, undefined, false)).toBe(true);
  });

  it("drops every event in a published app", () => {
    expect(shouldTrackEvent(KEPT_EVENT, APP_MODE.PUBLISHED, false)).toBe(false);
  });

  it("drops every event for an anonymous user, even in the editor", () => {
    expect(shouldTrackEvent(KEPT_EVENT, APP_MODE.EDIT, true)).toBe(false);
  });
});
