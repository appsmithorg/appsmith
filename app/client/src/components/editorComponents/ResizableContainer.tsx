import { Rnd } from "react-rnd";
import styled, { css } from "styled-components";
import { ContainerWidgetProps } from "widgets/ContainerWidget";
import { WidgetProps } from "widgets/BaseWidget";

export type ResizableComponentProps = ContainerWidgetProps<WidgetProps> & {
  paddingOffset: number;
};
interface ResizeBorderDotDivProps {
  isfocused: boolean;
}

const borderCSS = css<ResizeBorderDotDivProps>`
  position: relative;
  opacity: 0.99;
  height: 100%;
  &:after,
  &:before {
    content: "";
    position: absolute;
    width: ${props => props.theme.spaces[2]}px;
    height: ${props => props.theme.spaces[2]}px;
    border-radius: ${props => props.theme.radii[5]}%;
    background: ${props =>
      props.isfocused && props.theme.colors.containerBorder};
  }
`;

export const ResizeBorderDotDiv = styled.div<ResizeBorderDotDivProps>`
  ${borderCSS}
  &:after {
    left: -${props => props.theme.spaces[5]}px;
    top: calc(50% - ${props => props.theme.spaces[1]}px);
    z-index: 0;
  }
  &:before {
    left: calc(50% - ${props => props.theme.spaces[1]}px);
    top: -${props => props.theme.spaces[5]}px;
    z-index: 1;
  }
`;

export default styled(Rnd)`
  ${borderCSS}
  &:after {
    right: -${props => props.theme.spaces[1]}px;
    top: calc(50% - ${props => props.theme.spaces[1]}px);
    z-index: 0;
  }

  &:before {
    left: calc(50% - ${props => props.theme.spaces[1]}px);
    bottom: -${props => props.theme.spaces[1]}px;
    z-index: 1;
  }
`;
