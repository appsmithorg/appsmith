import React, {
  createContext,
  useState,
  Context,
  Dispatch,
  SetStateAction,
} from "react";
import styled from "styled-components";
import WidgetFactory from "../../utils/WidgetFactory";
import { RenderModes } from "../../constants/WidgetConstants";
import { ContainerWidgetProps } from "../../widgets/ContainerWidget";
import { WidgetProps } from "../../widgets/BaseWidget";

const ArtBoard = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  overflow: auto;
`;

interface CanvasProps {
  dsl: ContainerWidgetProps<WidgetProps>;
}

export const FocusContext: Context<{
  isFocused?: string;
  setFocus?: Dispatch<SetStateAction<string>>;
}> = createContext({});

const Canvas = (props: CanvasProps) => {
  const [isFocused, setFocus] = useState("");
  return (
    <FocusContext.Provider value={{ isFocused, setFocus }}>
      <ArtBoard>
        {props.dsl.widgetId &&
          WidgetFactory.createWidget(props.dsl, RenderModes.CANVAS)}
      </ArtBoard>
    </FocusContext.Provider>
  );
};

export default Canvas;
