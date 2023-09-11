import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import React from "react";
import { ClickContentToOpenPropPane } from "utils/hooks/useClickToSelectWidget";
import { ModalResizableLayer } from "../../common/resizer/ModalResizableLayer";
import { ModalOverlayLayer } from "../../common/modalOverlay/ModalOverlayLayer";
import { FixedLayoutWidgetComponent } from "../common/widgetComponent/FixedLayoutWidgetComponent";
import { WidgetNameLayer } from "../../common/widgetName/WidgetNameLayer";
import { get } from "lodash";
import { EVAL_ERROR_PATH } from "utils/DynamicBindingUtils";
import { isAutoHeightEnabledForWidget } from "widgets/WidgetUtils";

/**
 * FixedLayoutEditorModalOnion
 *
 * Component that wraps the BaseWidget implementation of a Widget with Editor specific wrappers
 * needed in Fixed Layout.
 *
 * Editor specific wrappers are wrappers added to perform actions in the editor.
 * - FixedLayoutWidgetComponent: provides layer to auto update height based on content/ add skeleton widget on loading state
 * - ModalOverlayLayer: provides blueprint library overlay for the modal widget to be rendered.
 * - ModalResizableLayer: provides the resize handles required to set dimension for a modal widget.
 * - WidgetNameLayer: provides the widget name in editing mode and also show error state if there are any.
 * - ClickContentToOpenPropPane: provides a way to open property pane on clicking on a modal widget content.
 *
 * @returns Enhanced Widget
 */

export const FixedLayoutEditorModalOnion = (props: BaseWidgetProps) => {
  return (
    <FixedLayoutWidgetComponent {...props}>
      <ModalOverlayLayer {...props} isEditMode>
        <ModalResizableLayer
          enableHorizontalResize
          enableVerticalResize={!isAutoHeightEnabledForWidget(props)}
          widgetProps={props}
        >
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
    </FixedLayoutWidgetComponent>
  );
};
