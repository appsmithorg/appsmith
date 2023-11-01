import React from "react";
import ReactDOM from "react-dom";
import { ternDocsInfo } from "@appsmith/utils/autocomplete/EntityDefinitions";
import type { Completion, TernCompletionResult } from "./CodemirrorTernService";
import { CodeEditorColors } from "components/editorComponents/CodeEditor/styledComponents";

export function renderTernTooltipContent(
  element: HTMLElement,
  completion: Completion<TernCompletionResult>,
) {
  ReactDOM.render(<TernDocToolTip completion={completion} />, element);
}

export function TernDocToolTip(props: {
  completion: Completion<TernCompletionResult>;
}) {
  const { completion } = props;
  const {
    data: { doc },
    displayText,
  } = completion;

  if (!doc || !displayText) return null;

  const examples =
    displayText in ternDocsInfo ? ternDocsInfo[displayText].exampleArgs : null;

  return (
    <div className="flex flex-col pb-1">
      <div className="flex items-center justify-start px-2 p-1 border-b border-mercury text-sm font-semibold">
        {displayText}
      </div>
      <div className="flex items-center justify-start px-2 p-1 text-xs whitespace-normal">
        {doc}
      </div>
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
                style={{ color: CodeEditorColors.FUNCTION_ARGS }}
              >
                {`${fnName}(`}
                <span style={{ color: CodeEditorColors.STRING }}>{args}</span>
                {")"}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
