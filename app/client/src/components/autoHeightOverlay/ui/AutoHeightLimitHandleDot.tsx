import styled from "styled-components";
import { OVERLAY_COLOR } from "../constants";

interface AutoHeightLimitHandleDotProps {
  isDragging: boolean;
}

const AutoHeightLimitHandleDot = styled.div<AutoHeightLimitHandleDotProps>`
  position: absolute;
  left: 50%;
  border-radius: 50%;
  width: 7px;
  height: 7px;
  transform: translateX(-50%)
    scale(${(props) => (props.isDragging ? "1.67" : "1")});
  border: 1px solid ${OVERLAY_COLOR};
  background-color: ${OVERLAY_COLOR};
  box-shadow: 0px 0px 0px 2px white;
`;

export default AutoHeightLimitHandleDot;
