import styled from "styled-components";
import { OVERLAY_COLOR } from "./constants";

interface DashedBorderProps {
  isActive: boolean;
}

export const DashedBorder = styled.div<DashedBorderProps>`
  background-image: linear-gradient(
    to right,
    ${OVERLAY_COLOR} 50%,
    rgba(255, 255, 255, 0) 0%
  );
  background-size: 8% 1px;
  background-repeat: repeat-x;
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  top: 0px;
  cursor: ns-resize;

  ${(props) => (props.isActive ? `background-color: ${OVERLAY_COLOR}` : "")}
`;
