import ErrorBoundary from "components/editorComponents/ErrorBoundry";
import React from "react";
import type { BaseWidgetProps } from "widgets/BaseWidget/withBaseWidget";
import DraggableComponent from "../../common/DraggableComponent";
import SnipeableComponent from "../../common/SnipeableComponent";
import { WidgetComponent } from "../../common/WidgetComponent";
import { WidgetNameLayer } from "../../common/WidgetNameLayer";
import { FlexComponentLayer } from "./FlexComponentLayer";
import { ResizableLayer } from "./ResizableLayer";
import { useAutoLayoutEditor } from "./useAutoLayoutEditor";

export const withAutoLayoutEditor = (props: BaseWidgetProps) => {
  const { autoDimensionConfig, getComponentDimensions } =
    useAutoLayoutEditor(props);
  const { componentHeight, componentWidth } = getComponentDimensions();
  const widgetEditorProps = {
    ...props,
    componentHeight,
    componentWidth,
    autoDimensionConfig,
  };
  return (
    <FlexComponentLayer {...widgetEditorProps}>
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
    </FlexComponentLayer>
  );
};
