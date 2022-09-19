import CodeMirror from "codemirror";
import { AUTOCOMPLETE_MATCH_REGEX } from "constants/BindingsConstants";
import { MarkHelper } from "components/editorComponents/CodeEditor/EditorConfig";
import history from "utils/history";

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

const createLink = (name: string, url: string): HTMLSpanElement => {
  const linkElement = document.createElement("span");
  linkElement.innerText = name;
  linkElement.className = "navigable-entity-highlight";
  linkElement.addEventListener("click", (e) => {
    if (e.ctrlKey || e.metaKey) {
      history.push(url);
    }
  });
  return linkElement;
};

export const entityMarker: MarkHelper = (
  editor: CodeMirror.Editor,
  entityNavigationData,
) => {
  editor.eachLine((line: CodeMirror.LineHandle) => {
    const lineNo = editor.getLineNumber(line) || 0;
    const tokens = editor.getLineTokens(lineNo);
    tokens.forEach((token) => {
      if (token.string in entityNavigationData) {
        const data = entityNavigationData[token.string];
        editor.markText(
          { ch: token.start, line: lineNo },
          { ch: token.end, line: lineNo },
          {
            replacedWith: createLink(token.string, data.url || ""),
          },
        );
      }
    });
  });
};
