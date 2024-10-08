import scrollIntoView from "scroll-into-view-if-needed";
import {
  modText,
  flashElementsById,
  isMacOrIOS,
  flashElement,
  shiftText,
} from "./helpers";
import localStorage from "./localStorage";
import {
  createMessage,
  WIDGET_ADDED,
  BULK_WIDGET_ADDED,
  WIDGET_REMOVED,
  BULK_WIDGET_REMOVED,
  ACTION_CONFIGURATION_CHANGED,
} from "ee/constants/messages";
import { toast } from "@appsmith/ads";
import { setPluginActionEditorSelectedTab } from "PluginActionEditor/store";
import store from "../store";

/**
 * process the toast for undo/redo
 *
 * @param undoRedoToasts
 */
export const processUndoRedoToasts = (
  undoRedoToasts: {
    isCreated: boolean;
    isUndo: boolean;
    widgetName: string | undefined;
    widgetId: string;
  }[],
) => {
  const { isCreated, isUndo } = undoRedoToasts[0];
  const isMultipleToasts = undoRedoToasts.length > 1;
  const widgetName = isMultipleToasts
    ? `${undoRedoToasts.length}`
    : undoRedoToasts[0].widgetName;

  if (isCreated)
    flashElementsById(
      undoRedoToasts.map((toast) => toast.widgetId),
      100,
      1000,
    );

  showUndoRedoToast(widgetName, isMultipleToasts, isCreated, !isUndo);
};

// context can be extended.
export enum UndoRedoToastContext {
  WIDGET = "widget",
  QUERY_TEMPLATES = "query-templates",
}

/**
 * shows a toast for undo/redo
 *
 * @param actionName
 * @param isMultiple
 * @param isCreated
 * @param shouldUndo
 * @param toastContext
 * @returns
 */
export const showUndoRedoToast = (
  actionName: string | undefined,
  isMultiple: boolean,
  isCreated: boolean,
  shouldUndo: boolean,
  toastContext = UndoRedoToastContext.WIDGET,
) => {
  if (
    shouldDisallowToast(shouldUndo) &&
    toastContext === UndoRedoToastContext.WIDGET
  )
    return;

  let actionDescription;
  let actionText = "";

  switch (toastContext) {
    case UndoRedoToastContext.WIDGET:
      actionDescription = getWidgetDescription(isCreated, isMultiple);
      actionText = createMessage(actionDescription, actionName);
      break;
    case UndoRedoToastContext.QUERY_TEMPLATES:
      actionDescription = ACTION_CONFIGURATION_CHANGED;
      actionText = createMessage(actionDescription, actionName);
      break;
    default:
      actionText = "";
  }

  const action = shouldUndo ? "undo" : "redo";
  const actionKey = shouldUndo
    ? `${modText()} Z`
    : isMacOrIOS()
      ? `${modText()} ${shiftText()} Z`
      : `${modText()} Y`;

  toast.show(`${actionText}. Press ${actionKey} to ${action}`);
};

function getWidgetDescription(isCreated: boolean, isMultiple: boolean) {
  if (isCreated) return isMultiple ? BULK_WIDGET_ADDED : WIDGET_ADDED;
  else return isMultiple ? BULK_WIDGET_REMOVED : WIDGET_REMOVED;
}

/**
 * search the dom with id of element and scroll the page to its position
 *
 * @param id
 */
export const scrollWidgetIntoView = (id: string) => {
  const el = document.getElementById(id);

  if (el)
    scrollIntoView(el, {
      scrollMode: "if-needed",
      block: "center",
      inline: "center",
    });
};

/**
 * checks if toast should be shown to user or not
 * if the item key is true, then disallowing showing toast
 *
 * @param shouldUndo
 * @returns
 */
export function shouldDisallowToast(shouldUndo: boolean): boolean {
  const itemKey = shouldUndo ? "undoToastShown" : "redoToastShown";

  const flag = localStorage.getItem(itemKey);

  if (flag === null || !flag) {
    localStorage.setItem(itemKey, "true");

    return false;
  }

  return true;
}

export function highlightReplayElement(configProperties: Array<string> = []) {
  const elements = configProperties
    .map((configProperty: string) => {
      const replayId = btoa(configProperty);

      return document.querySelector(
        `[data-location-id="${replayId}"]`,
      ) as HTMLElement;
    })
    .filter((el) => Boolean(el));

  if (elements.length === 1) {
    elements[0].scrollIntoView({ behavior: "smooth" });
  }

  elements.forEach((element) => flashElement(element));
}

export function switchTab(replayId: string): boolean {
  if (!replayId) return false;

  const element = document.querySelector(`[id$="${replayId}"]`) as HTMLElement;

  if (!element) return false;

  if (element.getAttribute("data-state") == "active") return false;

  store.dispatch(setPluginActionEditorSelectedTab(replayId));

  return true;
}

export function expandAccordion(replayId: string): boolean {
  if (!replayId) return false;

  const element = document.querySelector(
    `[data-location-id="section-${replayId}"]`,
  );

  if (!element) return false;

  const accordion = element.querySelector(
    ".bp3-icon-chevron-down",
  ) as HTMLElement;

  if (!accordion) return false;

  accordion.click();

  return true;
}
