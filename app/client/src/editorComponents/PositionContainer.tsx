import { IComponentProps } from "./BaseComponent";
import styled from "../constants/DefaultTheme";

const PositionContainer = styled("div")<IComponentProps>`
  color: ${props => props.theme.primaryColor};
  position: ${props => props.style.positionType};
  left: ${props => {
    return props.style.xPosition + props.style.xPositionUnit;
  }};
  top: ${props => {
    return props.style.yPosition + props.style.yPositionUnit;
  }};
`;

export default PositionContainer;
