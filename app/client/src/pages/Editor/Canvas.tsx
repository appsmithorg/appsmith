import React, { useState } from "react";
import WidgetFactory from "utils/WidgetFactory";
import { RenderModes } from "constants/WidgetConstants";
import { ContainerWidgetProps } from "widgets/ContainerWidget";
import { WidgetProps } from "widgets/BaseWidget";
import PropertyPane from "./PropertyPane";
import ArtBoard from "pages/common/ArtBoard";
import { DragResizeContext, FocusContext } from "./CanvasContexts";

interface CanvasProps {
  dsl: ContainerWidgetProps<WidgetProps>;
  showPropertyPane: (widgetId?: string, toggle?: boolean) => void;
  propertyPaneWidgetId?: string;
}

/* eslint-disable react/display-name */
/* eslint-disable react/prop-types */

const Canvas = (props: CanvasProps) => {
  const [selectedWidget, selectWidget] = useState();
  const [focusedWidget, focusWidget] = useState();
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  try {
    return (
      <DragResizeContext.Provider
        value={{ isResizing, setIsResizing, isDragging, setIsDragging }}
      >
        <FocusContext.Provider
          value={{
            selectedWidget,
            selectWidget,
            focusedWidget,
            focusWidget,
            showPropertyPane: props.showPropertyPane,
          }}
        >
          <PropertyPane />
          <ArtBoard width={props.dsl.rightColumn}>
            {props.dsl.widgetId &&
              WidgetFactory.createWidget(props.dsl, RenderModes.CANVAS)}
          </ArtBoard>
        </FocusContext.Provider>
      </DragResizeContext.Provider>
    );
  } catch (error) {
    console.log("Error rendering DSL", error);
    return null;
  }
};

export default Canvas;
