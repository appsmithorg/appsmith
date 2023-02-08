import CodeMirror from "codemirror";
import { AUTOCOMPLETE_MATCH_REGEX } from "constants/BindingsConstants";
import { MarkHelper } from "components/editorComponents/CodeEditor/EditorConfig";
import { NavigationData } from "selectors/navigationSelectors";

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

export const entityMarker: MarkHelper = (
  editor: CodeMirror.Editor,
  entityNavigationData,
) => {
  editor
    .getAllMarks()
    .filter(
      (marker) =>
        marker.className === NAVIGATION_CLASSNAME ||
        marker.className === PEEKABLE_CLASSNAME,
    )
    .forEach((marker) => marker.clear());

  editor.eachLine((line: CodeMirror.LineHandle) => {
    const lineNo = editor.getLineNumber(line) || 0;
    const tokens = editor.getLineTokens(lineNo);
    tokens.forEach((token) => {
      const tokenString = token.string;
      if (hasReference(token) && tokenString in entityNavigationData) {
        const data = entityNavigationData[tokenString];
        editor.markText(
          { ch: token.start, line: lineNo },
          { ch: token.end, line: lineNo },
          {
            className: NAVIGATION_CLASSNAME,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            attributes: {
              [NAVIGATE_TO_ATTRIBUTE]: `${data.name}`,
            },
            atomic: false,
            title: data.name,
          },
        );
        if (data.peekable) {
          editor.markText(
            { ch: token.start, line: lineNo },
            { ch: token.end, line: lineNo },
            {
              className: PEEKABLE_CLASSNAME,
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              attributes: {
                [PEEKABLE_ATTRIBUTE]: data.name,
              },
              atomic: false,
              title: data.name,
            },
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
          {
            className: NAVIGATION_CLASSNAME,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            attributes: {
              [NAVIGATE_TO_ATTRIBUTE]: `${childLink.name}`,
            },
            atomic: false,
            title: childLink.name,
          },
        );
      }
      if (childLink.peekable) {
        editor.markText(
          { ch: token.start, line: lineNo },
          { ch: token.end, line: lineNo },
          {
            className: PEEKABLE_CLASSNAME,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            attributes: {
              [PEEKABLE_ATTRIBUTE]: childLink.name,
            },
            atomic: false,
            title: childLink.name,
          },
        );
      }
      addMarksForChildren(childNodes[token.string], lineNo, token.end, editor);
    }
  }
};
