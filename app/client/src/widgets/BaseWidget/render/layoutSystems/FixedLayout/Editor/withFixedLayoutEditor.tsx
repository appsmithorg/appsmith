import ErrorBoundary from "components/editorComponents/ErrorBoundry";
import React from "react";
import { useBaseWidgetUtilities } from "widgets/BaseWidget/utilities/useBaseWidgetUtilities";
import type { BaseWidgetProps } from "widgets/BaseWidget/withBaseWidget";
import DraggableComponent from "widgets/BaseWidget/render/common/DraggableComponent";
import { PositionedComponentLayer } from "widgets/BaseWidget/render/layoutSystems/FixedLayout/PositionedComponentLayer";
import SnipeableComponent from "widgets/BaseWidget/render/common/SnipeableComponent";
import { WidgetComponent } from "widgets/BaseWidget/render/common/WidgetComponent";
import { WidgetNameLayer } from "widgets/BaseWidget/render/common/WidgetNameLayer";
import { useFixedLayoutEditor } from "./useFixedLayoutEditor";
import { ResizableLayer } from "../ResizableLayer";

export const withFixedLayoutEditor = (
  Widget: (widgetData: any) => JSX.Element,
  props: BaseWidgetProps,
) => {
  const baseWidgetUtilities = useBaseWidgetUtilities(props);
  const { getComponentDimensions } = useFixedLayoutEditor(props);
  const { componentHeight, componentWidth } = getComponentDimensions();
  const widgetEditorProps = {
    ...props,
    ...baseWidgetUtilities,
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
                  <Widget {...widgetEditorProps} />
                </WidgetComponent>
              </ErrorBoundary>
            </ResizableLayer>
          </WidgetNameLayer>
        </DraggableComponent>
      </SnipeableComponent>
    </PositionedComponentLayer>
  );
};
