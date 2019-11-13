import styled from "styled-components";
import { ContainerOrientation } from "constants/WidgetConstants";
import { Color } from "constants/Colors";
export type StyledContainerProps = {
  imageUrl?: string;
  orientation?: ContainerOrientation;
  backgroundColor?: Color;
};

export const StyledContainer = styled("div")<StyledContainerProps>`
  position: relative;
  display: flex;
  flex-direction: ${props => {
    return props.orientation === "HORIZONTAL" ? "row" : "column";
  }};
  background: ${props => props.backgroundColor};
  background-image: url(${props => props.imageUrl});
  height: 100%;
  width: 100%;
`;

export default StyledContainer;
