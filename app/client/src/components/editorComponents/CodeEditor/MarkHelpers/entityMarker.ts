import type {
  EntityNavigationData,
  NavigationData,
} from "entities/DataTree/dataTreeTypes";
import type { MarkHelper } from "../EditorConfig";

export const NAVIGATE_TO_ATTRIBUTE = "data-navigate-to";
export const NAVIGATION_CLASSNAME = "navigable-entity-highlight";

const hasReference = (token: CodeMirror.Token) => {
  const tokenString = token.string;

  return token.type === "variable" || tokenString === "this";
};

export const entityMarker: MarkHelper = (
  editor: CodeMirror.Editor,
  entityNavigationData,
  from,
  to,
) => {
  let markers: CodeMirror.TextMarker[] = [];

  if (from && to) {
    const toLine = editor.getLine(to.line);

    if (toLine) {
      markers = editor.findMarks(
        {
          line: from.line,
          ch: 0,
        },
        {
          line: to.line,
          ch: toLine.length - 1,
        },
      );
      clearMarkers(markers);

      editor.eachLine(from.line, to.line, (line: CodeMirror.LineHandle) => {
        addMarksForLine(editor, line, entityNavigationData);
      });
    }
  } else {
    markers = editor.getAllMarks();
    clearMarkers(markers);

    editor.eachLine((line: CodeMirror.LineHandle) => {
      addMarksForLine(editor, line, entityNavigationData);
    });
  }
};

const addMarksForLine = (
  editor: CodeMirror.Editor,
  line: CodeMirror.LineHandle,
  entityNavigationData: EntityNavigationData,
) => {
  const lineNo = editor.getLineNumber(line) || 0;
  const tokens = editor.getLineTokens(lineNo);

  tokens.forEach((token) => {
    const tokenString = token.string;

    if (hasReference(token) && tokenString in entityNavigationData) {
      const data = entityNavigationData[tokenString];

      if (data.navigable) {
        editor.markText(
          { ch: token.start, line: lineNo },
          { ch: token.end, line: lineNo },
          getMarkOptions(data),
        );
      }

      addMarksForChildren(
        entityNavigationData[tokenString],
        lineNo,
        token.end,
        editor,
      );
    }
  });
};

const addMarksForChildren = (
  navigationData: NavigationData,
  lineNo: number,
  tokenEnd: number,
  editor: CodeMirror.Editor,
) => {
  const childNodes = navigationData.children || {};

  if (Object.keys(childNodes).length) {
    const token = editor.getTokenAt(
      {
        ch: tokenEnd + 2,
        line: lineNo,
      },
      true,
    );

    if (token.string in childNodes) {
      const childLink = childNodes[token.string];

      if (childLink.navigable) {
        editor.markText(
          { ch: token.start, line: lineNo },
          { ch: token.end, line: lineNo },
          getMarkOptions(childLink),
        );
      }

      addMarksForChildren(childNodes[token.string], lineNo, token.end, editor);
    }
  }
};

const getMarkOptions = (data: NavigationData): CodeMirror.TextMarkerOptions => {
  return {
    className: `${data.navigable ? NAVIGATION_CLASSNAME : ""}`,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    attributes: {
      ...(data.navigable && {
        [NAVIGATE_TO_ATTRIBUTE]: `${data.name}`,
      }),
    },
    atomic: false,
    title: data.name,
  };
};

const clearMarkers = (markers: CodeMirror.TextMarker[]) => {
  markers.forEach((marker) => {
    if (marker.className?.includes(NAVIGATION_CLASSNAME)) marker.clear();
  });
};
