import CodeMirror from "codemirror";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import {
  DataTreeAction,
  DataTreeWidget,
} from "entities/DataTree/dataTreeFactory";
import { getDynamicStringSegments } from "utils/DynamicBindingUtils";

export const removeNewLineChars = (inputValue: any) => {
  return inputValue && inputValue.replace(/(\r\n|\n|\r)/gm, "");
};

export const getInputValue = (inputValue: any) => {
  if (typeof inputValue === "object" || typeof inputValue === "boolean") {
    inputValue = JSON.stringify(inputValue, null, 2);
  } else if (typeof inputValue === "number" || typeof inputValue === "string") {
    inputValue += "";
  }
  return inputValue;
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

export const isActionEntity = (entity: any): entity is DataTreeAction => {
  return entity.ENTITY_TYPE === ENTITY_TYPE.ACTION;
};

export const isWidgetEntity = (entity: any): entity is DataTreeWidget => {
  return entity.ENTITY_TYPE === ENTITY_TYPE.WIDGET;
};
