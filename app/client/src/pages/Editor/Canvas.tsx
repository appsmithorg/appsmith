import React, { createContext, useState, Context } from "react";
import WidgetFactory from "utils/WidgetFactory";
import { RenderModes } from "constants/WidgetConstants";
import { ContainerWidgetProps } from "widgets/ContainerWidget";
import { WidgetProps } from "widgets/BaseWidget";
import PropertyPane from "./PropertyPane";
import ArtBoard from "pages/common/ArtBoard";

interface CanvasProps {
  dsl: ContainerWidgetProps<WidgetProps>;
  showPropertyPane: (
    widgetId?: string,
    node?: HTMLDivElement,
    toggle?: boolean,
  ) => void;
}

export const FocusContext: Context<{
  isFocused?: string;
  setFocus?: Function;
  showPropertyPane?: (
    widgetId?: string,
    node?: HTMLDivElement,
    toggle?: boolean,
  ) => void;
}> = createContext({});

export const ResizingContext: Context<{
  isResizing?: boolean;
  setIsResizing?: Function;
}> = createContext({});

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
