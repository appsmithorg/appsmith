import styled from "styled-components";
import { OVERLAY_COLOR } from "../constants";

interface AutoHeightLimitHandleBorderProps {
  isActive: boolean;
}

const AutoHeightLimitHandleBorder = styled.div<
  AutoHeightLimitHandleBorderProps
>`
  background-image: linear-gradient(
    to right,
    ${OVERLAY_COLOR} 50%,
    rgba(255, 255, 255, 0) 0%
  );
  background-size: 8% 1px;
  background-repeat: repeat-x;
  height: 1px;
  width: 100%;

  ${(props) => (props.isActive ? `background-color: ${OVERLAY_COLOR}` : "")}
`;

export default AutoHeightLimitHandleBorder;
