import ErrorBoundary from "components/editorComponents/ErrorBoundry";
import React from "react";
import type { BaseWidgetProps } from "widgets/BaseWidget/withBaseWidget";
import DraggableComponent from "../../common/DraggableComponent";
import SnipeableComponent from "../../common/SnipeableComponent";
import { WidgetComponent } from "../../common/WidgetComponent";
import { WidgetNameLayer } from "../../common/WidgetNameLayer";
import { PositionedComponentLayer } from "./PositionedComponentLayer";
import { ResizableLayer } from "./ResizableLayer";
import { useFixedLayoutEditor } from "./useFixedLayoutEditor";

export const withFixedLayoutEditor = (props: BaseWidgetProps) => {
  const { getComponentDimensions } = useFixedLayoutEditor(props);
  const { componentHeight, componentWidth } = getComponentDimensions();
  const widgetEditorProps = {
    ...props,
    componentHeight,
    componentWidth,
  };
  return (
    <PositionedComponentLayer {...widgetEditorProps}>
      <SnipeableComponent {...widgetEditorProps}>
        <DraggableComponent {...widgetEditorProps}>
          <WidgetNameLayer {...widgetEditorProps}>
            <ResizableLayer {...widgetEditorProps}>
              <ErrorBoundary>
                <WidgetComponent {...widgetEditorProps}>
                  {props.children}
                </WidgetComponent>
              </ErrorBoundary>
            </ResizableLayer>
          </WidgetNameLayer>
        </DraggableComponent>
      </SnipeableComponent>
    </PositionedComponentLayer>
  );
};
