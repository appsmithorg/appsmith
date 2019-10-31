import { ComponentProps } from "./BaseComponent";
import { ContainerOrientation } from "../../constants/WidgetConstants";
import styled from "../../constants/DefaultTheme";
import React, {
  createContext,
  Context,
  useRef,
  useContext,
  forwardRef,
} from "react";
import { FocusContext } from "../../pages/Editor/Canvas";
import { getBorderCSSShorthand } from "../../constants/DefaultTheme";

export type StyledContainerProps = ContainerProps & {
  focus?: boolean;
  imageUrl?: string;
};

export const StyledContainer = styled("div")<StyledContainerProps>`
  display: flex;
  flex-direction: ${props => {
    return props.orientation === "HORIZONTAL" ? "row" : "column";
  }};
  background: ${props => props.imageUrl}
  background: ${props => props.style.backgroundColor};
  color: ${props => props.theme.colors.primary};
  position: ${props => {
    return props.style.positionType === "ABSOLUTE" ? "absolute" : "relative";
  }};
  height: 100%;
  left: 0;
  top: 0;
  width: 100%;
  padding: ${props => props.theme.spaces[1]}px;
  &:after {
    content: "${props => (props.focus ? props.widgetName : "")}";
    position: absolute;
    top: -${props => props.theme.spaces[8]}px;
    font-size: ${props => props.theme.fontSizes[2]}px;
    color: ${props => props.theme.colors.containerBorder};
    text-align: left;
    width: 100%;
  }`;

/* eslint-disable react/display-name */
/* eslint-disable react/prop-types */
type Ref = HTMLDivElement;
export const Container = forwardRef<Ref, ContainerProps>((props, ref) => {
  const { isFocused } = useContext(FocusContext);
  const focus = isFocused === props.widgetId;

  return <StyledContainer ref={ref} {...props} focus={focus} />;
});

export const ParentBoundsContext: Context<{
  boundingParent?: React.RefObject<HTMLDivElement>;
}> = createContext({});
type ContainerComponentWrapperProps = ContainerStyleProps & {
  isRoot?: boolean;
};
const ContainerComponentWrapper = styled.div<ContainerComponentWrapperProps>`
  /* TODO(abhinav)(Issue: #107): this will changed based on the ContainerStyleProps */
  border: ${props =>
    !props.isRoot && getBorderCSSShorthand(props.theme.borders[2])};
  box-shadow: ${props =>
    !props.isRoot ? "0px 2px 4px rgba(67, 70, 74, 0.14)" : "none"};
  height: 100%;
  width: 100%;
`;

const ContainerComponent = (props: ContainerProps) => {
  const container = useRef(null);
  return (
    <ParentBoundsContext.Provider value={{ boundingParent: container }}>
      <Container ref={container} {...props}>
        <ContainerComponentWrapper isRoot={props.isRoot}>
          {props.children}
        </ContainerComponentWrapper>
      </Container>
    </ParentBoundsContext.Provider>
  );
};

export interface ContainerProps extends ComponentProps {
  children?: JSX.Element[] | JSX.Element;
  orientation?: ContainerOrientation;
  isRoot?: boolean;
}

type ContainerStyleProps = {
  styleName?: "border" | "card" | "rounded-border";
};

export default ContainerComponent;
