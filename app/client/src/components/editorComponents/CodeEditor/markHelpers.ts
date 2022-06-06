import CodeMirror from "codemirror";
import { AUTOCOMPLETE_MATCH_REGEX } from "constants/BindingsConstants";
import { MarkHelper } from "components/editorComponents/CodeEditor/EditorConfig";
import { isActionEntity, isWidgetEntity } from "./codeEditorUtils";
import history from "utils/history";
import { apiEditorIdURL, builderURL, jsCollectionIdURL } from "RouteBuilder";
import { isJSAction } from "workers/evaluationUtils";
import { PluginType } from "entities/Action";

export const bindingMarker: MarkHelper = (
  editor: CodeMirror.Editor,
  options = {},
) => {
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

export const linkMarkers: MarkHelper = (
  editor: CodeMirror.Editor,
  options: Record<string, any>,
) => {
  const { dataTree } = options;
  editor
    .getDoc()
    .getAllMarks()
    .map((marker) => marker.clear());
  if (!dataTree) return;
  const entities = Object.keys(dataTree).join("|");
  const matchExp = new RegExp("\\b(" + entities + ")\\b", "g");
  editor.eachLine((line: CodeMirror.LineHandle) => {
    const lineNo = editor.getLineNumber(line) || 0;
    const matches = [...line.text.matchAll(matchExp)];
    matches &&
      [...matches].forEach((match) => {
        const ch = match.index;
        const range = editor.findWordAt({ line: lineNo, ch: ch || 0 }) || "";
        if (!range.empty()) {
          const text = line.text;
          const spanEle = document.createElement("span");
          const variable = text.slice(ch, range.to().ch);
          spanEle.classList.add("cm-variable");
          spanEle.classList.add("linked-doc");
          spanEle.innerHTML = variable;
          spanEle.onclick = function(e) {
            e.stopPropagation();
            if (!(e as MouseEvent).ctrlKey && !(e as MouseEvent).metaKey)
              return;
            const entity = dataTree[variable];
            if (!entity) return;
            if (!("ENTITY_TYPE" in entity)) return;
            if (isWidgetEntity(entity)) {
              history.push(builderURL({ hash: entity.widgetId }));
              return;
            }
            if (isJSAction(entity)) {
              history.push(jsCollectionIdURL({ collectionId: entity.id }));
              return;
            }
            if (isActionEntity(entity)) {
              if (entity.pluginType === PluginType.API) {
                history.push(apiEditorIdURL({ apiId: entity.actionId }));
                return;
              }
            }
          };
          editor.markText(range.from(), range.to(), {
            clearWhenEmpty: true,
            replacedWith: spanEle,
          });
        }
      });
  });
};
