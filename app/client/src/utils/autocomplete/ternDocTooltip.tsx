import React from "react";
import ReactDOM from "react-dom";
import { ternDocsInfo } from "@appsmith/utils/autocomplete/EntityDefinitions";
import type { Completion, TernCompletionResult } from "./CodemirrorTernService";
import { CodeEditorColors } from "components/editorComponents/CodeEditor/styledComponents";
import { Link } from "design-system";
import { CurrentValueViewer } from "components/editorComponents/CodeEditor/EvaluatedValuePopup";
import store from "store";
import type { AppState } from "@appsmith/reducers";
import { get } from "lodash";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";

export function renderTernTooltipContent(
  element: HTMLElement,
  completion: Completion<TernCompletionResult>,
) {
  ReactDOM.render(<TernDocToolTip completion={completion} />, element);
}

function getEvaluatedValue(fullPath: string) {
  const reduxState: AppState = store.getState();
  const evalTree = reduxState.evaluations.tree;
  return get(evalTree, fullPath);
}

export function TernDocToolTip(props: {
  completion: Completion<TernCompletionResult>;
}) {
  const { completion } = props;
  const {
    data: { doc, url },
    displayText,
    fullPath,
  } = completion;

  const value = fullPath && getEvaluatedValue(fullPath);

  const examples =
    displayText && displayText in ternDocsInfo
      ? ternDocsInfo[displayText].exampleArgs
      : null;

  return (
    <div className="flex flex-col pb-1 t--tern-doc">
      <div className="flex items-center justify-between px-2 p-1 border-b border-mercury text-sm font-semibold">
        {displayText}
        {url && (
          <Link
            className="text-xs doc-link"
            kind="primary"
            target="_blank"
            to={url}
          >
            [docs]
          </Link>
        )}
      </div>
      {value !== undefined && (
        <div>
          <CurrentValueViewer
            evaluatedValue={value}
            hideLabel
            theme={EditorTheme.LIGHT}
          />
        </div>
      )}
      {doc && (
        <pre
          className="px-2 p-1 text-xs whitespace-normal"
          dangerouslySetInnerHTML={{ __html: doc }}
        />
      )}
      {examples && (
        <div className="flex px-2 py-[2px] text-xs font-semibold">Example</div>
      )}
      {examples && (
        <div className="px-2">
          {examples.map((example: string) => {
            const fnName = displayText;
            const args = example;
            return (
              <span
                className="flex items-center justify-start py-[2px] text-xs whitespace-nowrap"
                key={example}
                style={{ color: CodeEditorColors.KEYWORD }}
              >
                {`${fnName}(`}
                <span style={{ color: CodeEditorColors.TOOLTIP_FN_ARGS }}>
                  {args}
                </span>
                {")"}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
