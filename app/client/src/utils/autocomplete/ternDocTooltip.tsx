import React from "react";
import ReactDOM from "react-dom";
import { ternDocsInfo } from "@appsmith/utils/autocomplete/EntityDefinitions";
import type { Completion, TernCompletionResult } from "./CodemirrorTernService";
import { CodeEditorColors } from "components/editorComponents/CodeEditor/constants";
import { Link } from "design-system";
import store from "store";
import type { AppState } from "@appsmith/reducers";
import get from "lodash/get";
import ReactJson from "react-json-view";
import { reactJsonProps } from "components/editorComponents/CodeEditor/PeekOverlayPopup/JsonWrapper";

export function renderTernTooltipContent(
  element: HTMLElement,
  completion: Completion<TernCompletionResult>,
  jsonViewClicked?: () => void,
) {
  ReactDOM.render(
    <TernDocToolTip
      completion={completion}
      jsonViewClicked={jsonViewClicked}
    />,
    element,
  );
}

function getEvaluatedValue(fullPath: string) {
  const reduxState: AppState = store.getState();
  const evalTree = reduxState.evaluations.tree;
  return get(evalTree, fullPath);
}

const getDataTypeHeader = (data: unknown) => {
  const dataType = typeof data;
  if (dataType === "object") {
    if (Array.isArray(data)) return "array";
    if (data === null) return "null";
  }
  return dataType;
};

export function TernDocToolTip(props: {
  completion: Completion<TernCompletionResult>;
  jsonViewClicked?: () => void;
}) {
  const { completion } = props;
  const {
    data: { doc, url },
    displayText,
    fullPath,
  } = completion;

  const value = (fullPath && getEvaluatedValue(fullPath)) || "";

  const examples =
    displayText && displayText in ternDocsInfo
      ? ternDocsInfo[displayText].exampleArgs
      : null;

  const dataType = getDataTypeHeader(value);

  return (
    <div className="flex flex-col pb-1 t--tern-doc w-80">
      <div
        className="flex items-center justify-between px-2 p-1 border-b border-mercury text-sm font-semibold sticky top-0 z-1"
        style={{ background: "var(--ads-v2-color-bg)" }}
      >
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

      <pre
        className="px-2 p-1 text-xs whitespace-normal"
        onClick={props.jsonViewClicked}
      >
        {(dataType === "object" || dataType === "array") && value !== null && (
          <ReactJson src={value} {...reactJsonProps} />
        )}
        {dataType === "function" && <div>{value.toString()}</div>}
        {dataType === "boolean" && <div>{value.toString()}</div>}
        {dataType === "string" && <div>{value.toString()}</div>}
        {dataType === "number" && <div>{value.toString()}</div>}
        {((dataType !== "object" &&
          dataType !== "function" &&
          dataType !== "boolean" &&
          dataType !== "string" &&
          dataType !== "array" &&
          dataType !== "number") ||
          value === null) && (
          <div>
            {value?.toString() ?? value ?? value === undefined
              ? "undefined"
              : "null"}
          </div>
        )}
      </pre>
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
