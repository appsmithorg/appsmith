import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import React from "react";
import { ClickContentToOpenPropPane } from "utils/hooks/useClickToSelectWidget";
import { ModalResizableLayer } from "../../common/resizer/ModalResizableLayer";
import { ModalOverlayLayer } from "../../common/modalOverlay/ModalOverlayLayer";
import { FixedLayoutWigdetComponent } from "../common/widgetComponent/FixedLayoutWidgetComponent";
import { WidgetNameLayer } from "../../common/widgetName/WidgetNameLayer";
import { get } from "lodash";
import { EVAL_ERROR_PATH } from "utils/DynamicBindingUtils";

export const FixedLayoutEditorModalOnion = (props: BaseWidgetProps) => {
  return (
    <FixedLayoutWigdetComponent {...props}>
      <ModalOverlayLayer {...props} isEditMode>
        <ModalResizableLayer {...props}>
          <WidgetNameLayer
            componentWidth={props.componentWidth}
            detachFromLayout={props.detachFromLayout}
            disablePropertyPane={props.disablePropertyPane}
            evalErrorsObj={get(props, EVAL_ERROR_PATH, {})}
            parentId={props.parentId}
            showControls
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
    </FixedLayoutWigdetComponent>
  );
};
