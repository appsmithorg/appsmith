import DraggableComponent from "components/editorComponents/DraggableComponent";
import SnipeableComponent from "components/editorComponents/SnipeableComponent";
import React from "react";
import { WidgetNameLayer } from "widgets/BaseWidgetHOC/render/common/WidgetNameLayer";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { AutoLayoutWidgetComponent } from "../common/AutoLayoutWidgetNameComponent";
import { FlexComponentLayer } from "../common/FlexComponentLayer";
import { ResizableLayer } from "./ResizableLayer";

export const AutoLayoutEditorWidgetOnion = (props: BaseWidgetProps) => {
  return (
    <FlexComponentLayer {...props}>
      <SnipeableComponent {...props}>
        <DraggableComponent {...props}>
          <WidgetNameLayer {...props}>
            <ResizableLayer {...props}>
              <AutoLayoutWidgetComponent {...props}>
                {props.children}
              </AutoLayoutWidgetComponent>
            </ResizableLayer>
          </WidgetNameLayer>
        </DraggableComponent>
      </SnipeableComponent>
    </FlexComponentLayer>
  );
};
