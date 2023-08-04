import ErrorBoundary from "components/editorComponents/ErrorBoundry";
import React from "react";
import { FlexComponentLayer } from "widgets/BaseWidget/render/layoutSystems/AutoLayout/FlexComponentLayer";
import { useBaseWidgetUtilities } from "widgets/BaseWidget/utilities/useBaseWidgetUtilities";
import type { BaseWidgetProps } from "widgets/BaseWidget/withBaseWidget";
import SnipeableComponent from "widgets/BaseWidget/render/common/SnipeableComponent";
import { WidgetComponent } from "widgets/BaseWidget/render/common/WidgetComponent";
import { WidgetNameLayer } from "widgets/BaseWidget/render/common/WidgetNameLayer";
import { useAutoLayoutEditor } from "./useAutoLayoutEditor";
import DraggableComponent from "widgets/BaseWidget/render/common/DraggableComponent";
import { ResizableLayer } from "../ResizableLayer";
import withWidgetProps from "widgets/withWidgetProps";
import type { WidgetProps } from "widgets/BaseWidget";

export const withAutoLayoutEditor = (
  Widget: (widgetData: any) => JSX.Element,
) => {
  function WrappedWidget(props: WidgetProps) {
    const baseWidgetUtilities = useBaseWidgetUtilities(props);
    const { autoDimensionConfig, getComponentDimensions } =
      useAutoLayoutEditor(props);
    const { componentHeight, componentWidth } = getComponentDimensions();
    const widgetEditorProps = {
      ...props,
      ...baseWidgetUtilities,
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
  return withWidgetProps(WrappedWidget as any);
};
