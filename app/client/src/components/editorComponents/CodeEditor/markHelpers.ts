import CodeMirror from "codemirror";
import { AUTOCOMPLETE_MATCH_REGEX } from "constants/BindingsConstants";
import { MarkHelper } from "components/editorComponents/CodeEditor/EditorConfig";
import {
  EntityNavigationData,
  NavigationData,
} from "selectors/navigationSelectors";

export const bindingMarker: MarkHelper = (editor: CodeMirror.Editor) => {
  editor.eachLine((line: CodeMirror.LineHandle) => {
    const lineNo = editor.getLineNumber(line) || 0;
    let match;
    while ((match = AUTOCOMPLETE_MATCH_REGEX.exec(line.text)) != null) {
      const opening = {
        start: match.index,
        end: match.index + 2,
      };
      const ending = {
        start: AUTOCOMPLETE_MATCH_REGEX.lastIndex - 2,
        end: AUTOCOMPLETE_MATCH_REGEX.lastIndex,
      };
      editor.markText(
        { ch: ending.start, line: lineNo },
        { ch: ending.end, line: lineNo },
        {
          className: "binding-brackets",
        },
      );
      editor.markText(
        { ch: opening.start, line: lineNo },
        { ch: opening.end, line: lineNo },
        {
          className: "binding-brackets",
        },
      );
      editor.markText(
        { ch: opening.start, line: lineNo },
        { ch: ending.end, line: lineNo },
        {
          className: "binding-highlight",
        },
      );
    }
  });
};

export const NAVIGATE_TO_ATTRIBUTE = "data-navigate-to";
export const NAVIGATION_CLASSNAME = "navigable-entity-highlight";

const hasReference = (token: CodeMirror.Token) => {
  const tokenString = token.string;
  return token.type === "variable" || tokenString === "this";
};

export const PEEKABLE_CLASSNAME = "peekaboo";
export const PEEKABLE_ATTRIBUTE = "peek-data";
export const PEEKABLE_LINE = "peek-line";
export const PEEKABLE_CH_START = "peek-ch-start";
export const PEEKABLE_CH_END = "peek-ch-end";
export const PEEK_STYLE_PERSIST_CLASS = "peek-style-persist";

export const entityMarker: MarkHelper = (
  editor: CodeMirror.Editor,
  entityNavigationData,
  from,
  to,
) => {
  let markers: CodeMirror.TextMarker[] = [];
  if (from && to) {
    markers = editor.findMarks(
      {
        line: from.line,
        ch: 0,
      },
      {
        line: to.line,
        // when a line is deleted?
        ch: editor.getLine(to.line).length - 1,
      },
    );
    clearMarkers(markers);
    // console.log("handle change ft markers");
    // console.log("handle change ft markers", from, to, markers);

    editor.eachLine(from.line, to.line, (line: CodeMirror.LineHandle) => {
      addMarksForLine(editor, line, entityNavigationData);
    });
  } else {
    markers = editor.getAllMarks();
    clearMarkers(markers);

    editor.eachLine((line: CodeMirror.LineHandle) => {
      addMarksForLine(editor, line, entityNavigationData);
    });
    // console.log("handle change all markers");
    // console.log("handle change all markers", markers);
  }

  // console.log("handle change end ---------");
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
      if (data.navigable || data.peekable) {
        editor.markText(
          { ch: token.start, line: lineNo },
          { ch: token.end, line: lineNo },
          getMarkOptions(data, token, lineNo),
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
      if (childLink.navigable || childLink.peekable) {
        editor.markText(
          { ch: token.start, line: lineNo },
          { ch: token.end, line: lineNo },
          getMarkOptions(childLink, token, lineNo),
        );
      }
      addMarksForChildren(childNodes[token.string], lineNo, token.end, editor);
    }
  }
};

const getMarkOptions = (
  data: NavigationData,
  token: CodeMirror.Token,
  lineNo: number,
): CodeMirror.TextMarkerOptions => {
  // console.log("handler change - get mark options");
  return {
    className: `${data.navigable ? NAVIGATION_CLASSNAME : ""} ${
      data.peekable ? PEEKABLE_CLASSNAME : ""
    }`,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    attributes: {
      ...(data.navigable && {
        [NAVIGATE_TO_ATTRIBUTE]: `${data.name}`,
      }),
      ...(data.peekable && {
        [PEEKABLE_ATTRIBUTE]: data.name,
        [PEEKABLE_CH_START]: token.start,
        [PEEKABLE_CH_END]: token.end,
        [PEEKABLE_LINE]: lineNo,
      }),
    },
    atomic: false,
    title: data.name,
  };
};

const clearMarkers = (markers: CodeMirror.TextMarker[]) => {
  markers.forEach((marker) => {
    if (
      marker.className?.includes(NAVIGATION_CLASSNAME) ||
      marker.className?.includes(PEEKABLE_CLASSNAME)
    )
      marker.clear();
  });
};
