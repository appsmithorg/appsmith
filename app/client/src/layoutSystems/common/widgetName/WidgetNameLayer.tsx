import WidgetNameComponent from "layoutSystems/common/widgetName";
import React from "react";
import { getErrorCount } from "./utils";

interface WidgetNameLayerProps {
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
}

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
