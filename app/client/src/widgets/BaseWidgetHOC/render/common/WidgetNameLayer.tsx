import WidgetNameComponent from "components/editorComponents/WidgetNameComponent";
import { get } from "lodash";
import React from "react";
import { EVAL_ERROR_PATH } from "utils/DynamicBindingUtils";
import type { WidgetProps } from "widgets/BaseWidget";

export const WidgetNameLayer = (props: WidgetProps) => {
  return !props.disablePropertyPane ? (
    <>
      <WidgetNameComponent
        errorCount={get(props, EVAL_ERROR_PATH, {})}
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
