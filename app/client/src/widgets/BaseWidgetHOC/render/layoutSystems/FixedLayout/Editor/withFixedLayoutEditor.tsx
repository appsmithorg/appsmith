import React from "react";
import { useFixedLayoutEditor } from "./useFixedLayoutEditor";
import type { WidgetProps } from "widgets/BaseWidget";
import { FixedLayoutEditorWidgetOnion } from "./FixedLayoutEditorWidgetOnion";
import { FixedLayoutEditorModalOnion } from "./FixedLayoutEditorModalOnion";

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
    const canvasWidget = props.type === "CANVAS_WIDGET";
    //Canvas_Onion
    if (canvasWidget) {
      return <Widget {...widgetEditorProps} />;
    }
    //Widget Onion
    const WidgetOnion =
      props.type === "MODAL_WIDGET"
        ? FixedLayoutEditorModalOnion
        : FixedLayoutEditorWidgetOnion;
    return (
      <WidgetOnion {...widgetEditorProps}>
        <Widget {...widgetEditorProps} />
      </WidgetOnion>
    );
  }
  return WrappedWidget;
};
