import WidgetNameComponent from "layoutSystems/common/widgetName";
import { memoize } from "lodash";
import React from "react";
import type { EvaluationError } from "utils/DynamicBindingUtils";

const getErrorCount = memoize(
  (evalErrors: Record<string, EvaluationError[]>) => {
    return Object.values(evalErrors).reduce(
      (prev, curr) => curr.length + prev,
      0,
    );
  },
  JSON.stringify,
);
type WidgetNameLayerProps = {
  disablePropertyPane?: boolean;
  children: any;
  parentId?: string;
  type: string;
  detachFromLayout?: boolean;
  topRow: number;
  widgetId: string;
  widgetName: string;
  componentWidth: number;
  evalErrorsObj: Record<any, any>;
  showControls?: boolean;
};

export const WidgetNameLayer = (props: WidgetNameLayerProps) => {
  return !props.disablePropertyPane ? (
    <>
      <WidgetNameComponent
        errorCount={getErrorCount(props.evalErrorsObj)}
        parentId={props.parentId}
        showControls={!!props.showControls}
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
