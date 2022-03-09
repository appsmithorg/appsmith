import React from "react";

import scrollIntoView from "scroll-into-view-if-needed";

import {
  modText,
  flashElementsById,
  isMac,
  flashElement,
  hasClass,
} from "./helpers";
import localStorage from "./localStorage";
import { Toaster } from "components/ads/Toast";
import {
  createMessage,
  WIDGET_ADDED,
  BULK_WIDGET_ADDED,
  WIDGET_REMOVED,
  BULK_WIDGET_REMOVED,
} from "@appsmith/constants/messages";

/**
 * get the text for toast
 *
 * @param replayType
 * @returns
 */
export const getReplayToastActionText = (replayType = "undo") => {
  switch (replayType) {
    case "undo":
      return <>UNDO ({modText()}+Z) </>;
    case "redo":
      return isMac() ? (
        <>
          REDO ({modText()}+<span>&#8682;</span>+Z){" "}
        </>
      ) : (
        <>REDO ({modText()}+Y) </>
      );
  }
};

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

/**
 * shows a toast for undo/redo
 *
 * @param widgetName
 * @param isMultiple
 * @param isCreated
 * @param shouldUndo
 * @returns
 */
export const showUndoRedoToast = (
  widgetName: string | undefined,
  isMultiple: boolean,
  isCreated: boolean,
  shouldUndo: boolean,
) => {
  if (shouldDisallowToast(shouldUndo)) return;

  const actionDescription = getActionDescription(isCreated, isMultiple);

  const text = createMessage(actionDescription, widgetName);
  const actionElement = getReplayToastActionText(shouldUndo ? "undo" : "redo");

  Toaster.show({
    text,
    actionElement,
    maxWidth: "500px",
  });
};

function getActionDescription(isCreated: boolean, isMultiple: boolean) {
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
        `[data-replay-id="${replayId}"]`,
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
  const element = document.querySelector(
    `[data-replay-id="${replayId}"]`,
  ) as HTMLElement;
  if (!element) return false;
  if (hasClass(element, "react-tabs__tab--selected")) return false;
  element?.click();
  return true;
}

export function expandAccordion(replayId: string): boolean {
  if (!replayId) return false;
  const element = document.querySelector(
    `[data-replay-id="section-${replayId}"]`,
  );
  if (!element) return false;
  const accordion = element.querySelector(
    ".bp3-icon-chevron-down",
  ) as HTMLElement;
  if (!accordion) return false;
  accordion.click();
  return true;
}
