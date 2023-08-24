import ErrorBoundary from "components/editorComponents/ErrorBoundry";
import React from "react";
import DraggableComponent from "widgets/BaseWidgetHOC/render/common/DraggableComponent";
import SnipeableComponent from "widgets/BaseWidgetHOC/render/common/SnipeableComponent";
import { WidgetNameLayer } from "widgets/BaseWidgetHOC/render/common/WidgetNameLayer";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { AutoHeightOverlayLayer } from "../common/AutoHeightOverlayLayer";
import { FixedLayoutWigdetComponent } from "../common/FixedLayoutWidgetComponent";
import { PositionedComponentLayer } from "../PositionedComponentLayer";
import { ResizableLayer } from "../ResizableLayer";

export const FixedLayoutEditorWidgetOnion = (props: BaseWidgetProps) => {
  return (
    <ErrorBoundary>
      <AutoHeightOverlayLayer {...props}>
        <PositionedComponentLayer {...props}>
          <SnipeableComponent {...props}>
            <DraggableComponent {...props}>
              <WidgetNameLayer {...props}>
                <ResizableLayer {...props}>
                  <FixedLayoutWigdetComponent {...props}>
                    {props.children}
                  </FixedLayoutWigdetComponent>
                </ResizableLayer>
              </WidgetNameLayer>
            </DraggableComponent>
          </SnipeableComponent>
        </PositionedComponentLayer>
      </AutoHeightOverlayLayer>
    </ErrorBoundary>
  );
};
