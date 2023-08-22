import ErrorBoundary from "components/editorComponents/ErrorBoundry";
import React from "react";
import DraggableComponent from "widgets/BaseWidgetHOC/render/common/DraggableComponent";
import SnipeableComponent from "widgets/BaseWidgetHOC/render/common/SnipeableComponent";
import { WidgetComponent } from "widgets/BaseWidgetHOC/render/common/WidgetComponent";
import { WidgetNameLayer } from "widgets/BaseWidgetHOC/render/common/WidgetNameLayer";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { AutoHeightLayer } from "../AutoHeightLayer";
import { PositionedComponentLayer } from "../PositionedComponentLayer";
import { ResizableLayer } from "../ResizableLayer";

export const FixedLayoutEditorWidgetOnion = (props: BaseWidgetProps) => {
  return (
    <AutoHeightLayer {...props}>
      <PositionedComponentLayer {...props}>
        <SnipeableComponent {...props}>
          <DraggableComponent {...props}>
            <WidgetNameLayer {...props}>
              <ResizableLayer {...props}>
                <ErrorBoundary>
                  <WidgetComponent {...props}>{props.children}</WidgetComponent>
                </ErrorBoundary>
              </ResizableLayer>
            </WidgetNameLayer>
          </DraggableComponent>
        </SnipeableComponent>
      </PositionedComponentLayer>
    </AutoHeightLayer>
  );
};
