import React, { useState } from "react";
import WidgetFactory from "utils/WidgetFactory";
import { RenderModes } from "constants/WidgetConstants";
import { ContainerWidgetProps } from "widgets/ContainerWidget";
import { WidgetProps } from "widgets/BaseWidget";
import PropertyPane from "./PropertyPane";
import ArtBoard from "pages/common/ArtBoard";
import { ResizingContext, FocusContext } from "./CanvasContexts";

interface CanvasProps {
  dsl: ContainerWidgetProps<WidgetProps>;
  showPropertyPane: (
    widgetId?: string,
    node?: HTMLDivElement,
    toggle?: boolean,
  ) => void;
  propertyPaneWidgetId?: string;
}

/* eslint-disable react/display-name */
/* eslint-disable react/prop-types */

const Canvas = (props: CanvasProps) => {
  const [isFocused, setFocus] = useState("");
  const [isResizing, setIsResizing] = useState(false);
  try {
    return (
      <ResizingContext.Provider value={{ isResizing, setIsResizing }}>
        <FocusContext.Provider
          value={{
            isFocused,
            setFocus,
            showPropertyPane: props.showPropertyPane,
            propertyPaneWidgetId: props.propertyPaneWidgetId,
          }}
        >
          <PropertyPane />
          <ArtBoard>
            {props.dsl.widgetId &&
              WidgetFactory.createWidget(props.dsl, RenderModes.CANVAS)}
          </ArtBoard>
        </FocusContext.Provider>
      </ResizingContext.Provider>
    );
  } catch (error) {
    console.log("Error rendering DSL", error);
    return null;
  }
};

export default Canvas;
