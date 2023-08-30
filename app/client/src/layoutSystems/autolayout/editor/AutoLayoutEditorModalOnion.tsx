import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import React from "react";
import { ClickContentToOpenPropPane } from "utils/hooks/useClickToSelectWidget";
import { ModalResizableLayer } from "../../common/resizer/ModalResizableLayer";
import { AutoLayoutWidgetComponent } from "../common/widgetComponent/AutoLayoutWidgetComponent";
import { ModalOverlayLayer } from "../../common/modalOverlay/ModalOverlayLayer";
import { WidgetNameLayer } from "../../common/widgetName/WidgetNameLayer";
import { EVAL_ERROR_PATH } from "utils/DynamicBindingUtils";
import { get } from "lodash";

export const AutoLayoutEditorModalOnion = (props: BaseWidgetProps) => {
  return (
    <AutoLayoutWidgetComponent {...props}>
      <ModalOverlayLayer {...props} isEditMode>
        <ModalResizableLayer {...props}>
          <WidgetNameLayer
            componentWidth={props.componentWidth}
            detachFromLayout={props.detachFromLayout}
            disablePropertyPane={props.disablePropertyPane}
            evalErrorsObj={get(props, EVAL_ERROR_PATH, {})}
            parentId={props.parentId}
            topRow={props.topRow}
            type={props.type}
            widgetId={props.widgetId}
            widgetName={props.widgetName}
          >
            <ClickContentToOpenPropPane widgetId={props.widgetId}>
              {props.children}
            </ClickContentToOpenPropPane>
          </WidgetNameLayer>
        </ModalResizableLayer>
      </ModalOverlayLayer>
    </AutoLayoutWidgetComponent>
  );
};
