import React from "react";

import scrollIntoView from "scroll-into-view-if-needed";

import { isMac } from "./helpers";
import localStorage from "./localStorage";
import { Toaster } from "components/ads/Toast";
import {
  createMessage,
  WIDGET_ADDED,
  BULK_WIDGET_ADDED,
  WIDGET_REMOVED,
  BULK_WIDGET_REMOVED,
} from "constants/messages";

export const modText = () => (isMac() ? <span>&#8984;</span> : "CTRL");

export const redoElement = (
  <>
    REDO ({modText()}+<span>&#8682;</span>+Z)
  </>
);

export const undoElement = <>UNDO ({modText()}+Z) </>;

export const processUndoRedoToasts = (
  undoRedoToasts: {
    isCreated: boolean;
    isUndo: boolean;
    widgetName: string | undefined;
  }[],
) => {
  const { isCreated, isUndo } = undoRedoToasts[0];
  const isMultipleToasts = undoRedoToasts.length > 1;
  const widgetName = isMultipleToasts
    ? `${undoRedoToasts.length}`
    : undoRedoToasts[0].widgetName;

  showUndoRedoToast(widgetName, isMultipleToasts, isCreated, !isUndo);
};

export const showUndoRedoToast = (
  widgetName: string | undefined,
  isMultiple: boolean,
  isCreated: boolean,
  shouldUndo: boolean,
) => {
  if (shouldNotShowToast(shouldUndo)) return;

  const actionDescription = isCreated
    ? isMultiple
      ? BULK_WIDGET_ADDED
      : WIDGET_ADDED
    : isMultiple
    ? BULK_WIDGET_REMOVED
    : WIDGET_REMOVED;

  const text = createMessage(actionDescription, widgetName);
  const actionElement = shouldUndo ? undoElement : redoElement;

  Toaster.show({
    text,
    actionElement,
  });
};

export const scrollWidgetIntoView = (id: string) => {
  const el = document.getElementById(id);
  if (el)
    scrollIntoView(el, {
      scrollMode: "if-needed",
      block: "center",
      inline: "center",
    });
};

function shouldNotShowToast(shouldUndo: boolean): boolean {
  const itemKey = shouldUndo ? "undoToastShown" : "redoToastShown";

  const flag = localStorage.getItem(itemKey);

  if (flag === null || !flag) {
    localStorage.setItem(itemKey, "true");
    return false;
  }

  return true;
}
