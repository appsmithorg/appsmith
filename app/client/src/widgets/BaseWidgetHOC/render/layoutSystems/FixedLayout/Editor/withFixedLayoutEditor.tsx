import ErrorBoundary from "components/editorComponents/ErrorBoundry";
import React from "react";
import { useFixedLayoutEditor } from "./useFixedLayoutEditor";
import { ResizableLayer } from "../ResizableLayer";
import type { WidgetProps } from "widgets/BaseWidget";
import SnipeableComponent from "widgets/BaseWidgetHOC/render/common/SnipeableComponent";
import { PositionedComponentLayer } from "../PositionedComponentLayer";
import DraggableComponent from "widgets/BaseWidgetHOC/render/common/DraggableComponent";
import { WidgetNameLayer } from "widgets/BaseWidgetHOC/render/common/WidgetNameLayer";
import { WidgetComponent } from "widgets/BaseWidgetHOC/render/common/WidgetComponent";

export const withFixedLayoutEditor = (
  Widget: (widgetData: any) => JSX.Element | null,
) => {
  function WrappedWidget(props: WidgetProps) {
    const { getComponentDimensions } = useFixedLayoutEditor(props);
    const { componentHeight, componentWidth } = getComponentDimensions();
    const widgetEditorProps = {
      ...props,
      componentHeight,
      componentWidth,
    };
    if (props.type === "CANVAS_WIDGET") {
      return <Widget {...widgetEditorProps} />;
    }
    return (
      <PositionedComponentLayer {...widgetEditorProps}>
        <SnipeableComponent {...widgetEditorProps}>
          <DraggableComponent {...widgetEditorProps}>
            <WidgetNameLayer {...widgetEditorProps}>
              <ResizableLayer {...widgetEditorProps}>
                <ErrorBoundary>
                  <WidgetComponent {...widgetEditorProps}>
                    <Widget {...widgetEditorProps} />
                  </WidgetComponent>
                </ErrorBoundary>
              </ResizableLayer>
            </WidgetNameLayer>
          </DraggableComponent>
        </SnipeableComponent>
      </PositionedComponentLayer>
    );
  }
  return WrappedWidget;
};
