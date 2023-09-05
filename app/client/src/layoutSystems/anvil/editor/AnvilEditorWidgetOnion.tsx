import React from "react";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { AnvilFlexComponent } from "../common/AnvilFlexComponent";
import SnipeableComponent from "layoutSystems/common/snipeable/SnipeableComponent";
import { AnvilWidgetComponent } from "../common/widgetComponent/AnvilWidgetComponent";
import DraggableComponent from "layoutSystems/common/draggable/DraggableComponent";
import { AnvileResizableLayer } from "../common/resizer/AnvilResizableLayer";

export const AnvilEditorWidgetOnion = (props: BaseWidgetProps) => {
  return (
    <AnvilFlexComponent {...props}>
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
