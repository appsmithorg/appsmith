import WidgetNameComponent from "components/editorComponents/WidgetNameComponent";
import { get } from "lodash";
import React from "react";
import { getErrorCount } from "selectors/debuggerSelectors";
import { EVAL_ERROR_PATH } from "utils/DynamicBindingUtils";
import type { BaseWidgetProps } from "widgets/BaseWidget/withBaseWidget";

export const WidgetNameLayer = (props: BaseWidgetProps) => {
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
