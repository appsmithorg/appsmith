import DraggableComponent from "components/editorComponents/DraggableComponent";
import ErrorBoundary from "components/editorComponents/ErrorBoundry";
import SnipeableComponent from "components/editorComponents/SnipeableComponent";
import React from "react";
import { WidgetComponent } from "widgets/BaseWidgetHOC/render/common/WidgetComponent";
import { WidgetNameLayer } from "widgets/BaseWidgetHOC/render/common/WidgetNameLayer";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { FlexComponentLayer } from "../common/FlexComponentLayer";
import { ResizableLayer } from "./ResizableLayer";

export const AutoLayoutEditorWidgetOnion = (props: BaseWidgetProps) => {
  return (
    <FlexComponentLayer {...props}>
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
    </FlexComponentLayer>
  );
};
