import DraggableComponent from "components/editorComponents/DraggableComponent";
import ErrorBoundary from "components/editorComponents/ErrorBoundry";
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
              <ErrorBoundary>
                <AutoLayoutWidgetComponent {...props}>
                  {props.children}
                </AutoLayoutWidgetComponent>
              </ErrorBoundary>
            </ResizableLayer>
          </WidgetNameLayer>
        </DraggableComponent>
      </SnipeableComponent>
    </FlexComponentLayer>
  );
};
