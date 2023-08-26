import WidgetNameComponent from "components/editorComponents/WidgetNameComponent";
import { get, memoize } from "lodash";
import React from "react";
import { EVAL_ERROR_PATH } from "utils/DynamicBindingUtils";
import type { EvaluationError } from "utils/DynamicBindingUtils";
import type { WidgetProps } from "widgets/BaseWidget";

const getErrorCount = memoize(
  (evalErrors: Record<string, EvaluationError[]>) => {
    return Object.values(evalErrors).reduce(
      (prev, curr) => curr.length + prev,
      0,
    );
  },
  JSON.stringify,
);
export const WidgetNameLayer = (props: WidgetProps) => {
  return !props.disablePropertyPane ? (
    <>
      <WidgetNameComponent
        errorCount={getErrorCount(get(props, EVAL_ERROR_PATH, {}))}
        parentId={props.parentId}
        showControls={props.type === "MODAL_WIDGET"}
        topRow={props.detachFromLayout ? 4 : props.topRow}
        type={props.type}
        widgetId={props.widgetId}
        widgetName={props.widgetName}
        widgetWidth={props.componentWidth}
      />
      {props.children}
    </>
  ) : (
    props.children
  );
};
