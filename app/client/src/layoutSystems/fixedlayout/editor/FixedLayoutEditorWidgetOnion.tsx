import DraggableComponent from "layoutSystems/common/draggable/DraggableComponent";
import { get } from "lodash";
import React from "react";
import { EVAL_ERROR_PATH } from "utils/DynamicBindingUtils";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import SnipeableComponent from "../../common/SnipeableComponent";
import { WidgetNameLayer } from "../../common/widgetName/WidgetNameLayer";
import { AutoHeightOverlayLayer } from "../common/autoHeight/AutoHeightOverlayLayer";
import { FixedLayoutWigdetComponent } from "../common/FixedLayoutWidgetComponent";
import { FixedResizableLayer } from "../common/FixedResizableLayer";
import { PositionedComponentLayer } from "../PositionedComponentLayer";

export const FixedLayoutEditorWidgetOnion = (props: BaseWidgetProps) => {
  return (
    <AutoHeightOverlayLayer {...props}>
      <PositionedComponentLayer {...props}>
        <SnipeableComponent type={props.type} widgetId={props.widgetId}>
          <DraggableComponent {...props}>
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
              <FixedResizableLayer {...props}>
                <FixedLayoutWigdetComponent {...props}>
                  {props.children}
                </FixedLayoutWigdetComponent>
              </FixedResizableLayer>
            </WidgetNameLayer>
          </DraggableComponent>
        </SnipeableComponent>
      </PositionedComponentLayer>
    </AutoHeightOverlayLayer>
  );
};
