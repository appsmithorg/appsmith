import type CodeMirror from "codemirror";
import { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";
import type { WidgetEntity, ActionEntity } from "ee/entities/DataTree/types";
import { trim } from "lodash";
import { getDynamicStringSegments } from "utils/DynamicBindingUtils";
import { EditorSize } from "./EditorConfig";
import { SlashCommandMenuOnFocusWidgetProps } from "./constants";

export const removeNewLineChars = (inputValue: string) => {
  return inputValue && inputValue.replace(/(\r\n|\n|\r)/gm, "");
};

export const getInputValue = (inputValue: unknown): string => {
  if (typeof inputValue === "object" || typeof inputValue === "boolean") {
    inputValue = JSON.stringify(inputValue, null, 2);
  } else if (typeof inputValue === "number" || typeof inputValue === "string") {
    inputValue += "";
  }

  return String(inputValue || "");
};
const computeCursorIndex = (editor: CodeMirror.Editor) => {
  const cursor = editor.getCursor();
  let cursorIndex = cursor.ch;

  if (cursor.line > 0) {
    for (let lineIndex = 0; lineIndex < cursor.line; lineIndex++) {
      const line = editor.getLine(lineIndex);

      cursorIndex = cursorIndex + line.length + 1;
    }
  }

  return cursorIndex;
};

export const checkIfCursorInsideBinding = (
  editor: CodeMirror.Editor,
): boolean => {
  let cursorBetweenBinding = false;
  const value = editor.getValue();
  const cursorIndex = computeCursorIndex(editor);
  const stringSegments = getDynamicStringSegments(value);
  // count of chars processed
  let cumulativeCharCount = 0;

  stringSegments.forEach((segment: string) => {
    const start = cumulativeCharCount;
    const dynamicStart = segment.indexOf("{{");
    const dynamicDoesStart = dynamicStart > -1;
    const dynamicEnd = segment.indexOf("}}");
    const dynamicDoesEnd = dynamicEnd > -1;
    const dynamicStartIndex = dynamicStart + start + 2;
    const dynamicEndIndex = dynamicEnd + start;

    if (
      dynamicDoesStart &&
      cursorIndex >= dynamicStartIndex &&
      ((dynamicDoesEnd && cursorIndex <= dynamicEndIndex) ||
        (!dynamicDoesEnd && cursorIndex >= dynamicStartIndex))
    ) {
      cursorBetweenBinding = true;
    }

    cumulativeCharCount = start + segment.length;
  });

  return cursorBetweenBinding;
};

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isActionEntity = (entity: any): entity is ActionEntity => {
  return entity.ENTITY_TYPE === ENTITY_TYPE.ACTION;
};

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isWidgetEntity = (entity: any): entity is WidgetEntity => {
  return entity.ENTITY_TYPE === ENTITY_TYPE.WIDGET;
};

interface Event {
  eventType: string;
  eventHandlerFn?: (event: MouseEvent) => void;
}

export const addEventToHighlightedElement = (
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  element: any,
  customClassName: string,
  events?: Event[],
) => {
  element = document.getElementsByClassName(
    customClassName, // the text class name is the classname used for the markText-fn for highlighting the text.
  )[0];

  if (events) {
    for (const event of events) {
      if (element && !!event.eventType && !!event.eventHandlerFn) {
        // if the highlighted element exists, add an event listener to it.
        element.addEventListener(event.eventType, event.eventHandlerFn);
      }
    }
  }
};

export const removeEventFromHighlightedElement = (
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  element: any,
  events?: Event[],
) => {
  if (events) {
    for (const event of events) {
      if (element && !!event.eventType && !!event.eventHandlerFn) {
        element.removeEventListener(event.eventType, event.eventHandlerFn);
      }
    }
  }
};

/*
  @params:
    inputVal: value that needs to be transformed
    editorSize: size of code editor
  @returns transformed string with or without new line chars based on editor size
*/
export const removeNewLineCharsIfRequired = (
  inputVal: string,
  editorSize: EditorSize,
) => {
  let resultVal;

  if (editorSize === EditorSize.COMPACT) {
    resultVal = removeNewLineChars(inputVal);
  } else {
    resultVal = inputVal;
  }

  return resultVal;
};

// Checks if string at the position of the cursor is empty
export function isCursorOnEmptyToken(editor: CodeMirror.Editor) {
  const currentCursorPosition = editor.getCursor();
  const { string: stringAtCurrentPosition } = editor.getTokenAt(
    currentCursorPosition,
  );
  const isEmptyString = !(
    stringAtCurrentPosition && trim(stringAtCurrentPosition)
  );

  return isEmptyString;
}

// This function tells us whether to show slash command menu on focus or not
// Based on widget type and the property path
export function shouldShowSlashCommandMenu(
  widgetType: string = "",
  propertyPath: string = "",
) {
  return (
    !!SlashCommandMenuOnFocusWidgetProps[widgetType] &&
    SlashCommandMenuOnFocusWidgetProps[widgetType].includes(propertyPath)
  );
}

// Checks if the input value is only one word
export const isSingleWord = (editor: CodeMirror.Editor) => {
  const value = editor.getValue();
  // Split the value by whitespace
  const stringSegments = value.split(/\s+/);

  return stringSegments.length === 1;
};
