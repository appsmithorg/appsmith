import ErrorBoundary from "components/editorComponents/ErrorBoundry";
import React from "react";
import { useAutoLayoutEditor } from "./useAutoLayoutEditor";
import { ResizableLayer } from "../ResizableLayer";
import type { WidgetProps } from "widgets/BaseWidget";
import { FlexComponentLayer } from "../FlexComponentLayer";
import SnipeableComponent from "widgets/BaseWidgetHOC/render/common/SnipeableComponent";
import DraggableComponent from "widgets/BaseWidgetHOC/render/common/DraggableComponent";
import { WidgetNameLayer } from "widgets/BaseWidgetHOC/render/common/WidgetNameLayer";
import { WidgetComponent } from "widgets/BaseWidgetHOC/render/common/WidgetComponent";

export const withAutoLayoutEditor = (
  Widget: (widgetData: any) => JSX.Element | null,
) => {
  function WrappedWidget(props: WidgetProps) {
    const { autoDimensionConfig, getComponentDimensions } =
      useAutoLayoutEditor(props);
    const { componentHeight, componentWidth } = getComponentDimensions();
    const widgetEditorProps = {
      ...props,
      componentHeight,
      componentWidth,
      autoDimensionConfig,
    };
    //Canvas_Onion
    if (props.type === "CANVAS_WIDGET") {
      return <Widget {...widgetEditorProps} />;
    }
    //Widget Onion
    return (
      <FlexComponentLayer {...widgetEditorProps}>
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
      </FlexComponentLayer>
    );
  }
  return WrappedWidget;
};
