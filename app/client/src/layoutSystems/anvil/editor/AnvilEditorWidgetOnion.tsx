import React from "react";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { AnvilFlexComponent } from "../common/AnvilFlexComponent";
import SnipeableComponent from "layoutSystems/common/snipeable/SnipeableComponent";
import { AnvilWidgetComponent } from "../common/widgetComponent/AnvilWidgetComponent";
import DraggableComponent from "layoutSystems/common/draggable/DraggableComponent";
import { AnvileResizableLayer } from "../common/resizer/AnvilResizableLayer";
import { FlexVerticalAlignment } from "../utils/constants";

export const AnvilEditorWidgetOnion = (props: BaseWidgetProps) => {
  return (
    <AnvilFlexComponent
      alignment={props.alignment}
      componentHeight={props.componentHeight}
      componentWidth={props.componentWidth}
      flexVerticalAlignment={
        props.flexVerticalAlignment || FlexVerticalAlignment.Bottom
      }
      focused={props.focused}
      hasAutoHeight={!!props.hasAutoHeight}
      hasAutoWidth={!!props.hasAutoWidth}
      isMobile={props.isMobile || false}
      isResizeDisabled={props.resizeDisabled}
      parentColumnSpace={props.parentColumnSpace}
      parentId={props.parentId}
      renderMode={props.renderMode}
      responsiveBehavior={props.responsiveBehavior}
      selected={props.selected}
      widgetId={props.widgetId}
      widgetName={props.widgetName}
      widgetSize={props.widgetSize}
      widgetType={props.type}
    >
      <SnipeableComponent type={props.type} widgetId={props.widgetId}>
        <DraggableComponent
          bottomRow={props.bottomRow}
          isFlexChild
          leftColumn={props.leftColumn}
          parentColumnSpace={props.parentColumnSpace}
          parentId={props.parentId}
          parentRowSpace={props.parentRowSpace}
          resizeDisabled={props.resizeDisabled}
          rightColumn={props.rightColumn}
          topRow={props.topRow}
          type={props.type}
          widgetId={props.widgetId}
        >
          <AnvileResizableLayer {...props}>
            <AnvilWidgetComponent {...props}>
              {props.children}
            </AnvilWidgetComponent>
          </AnvileResizableLayer>
        </DraggableComponent>
      </SnipeableComponent>
    </AnvilFlexComponent>
  );
};
