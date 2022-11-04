import styled from "styled-components";

interface OverlayDisplayProps {
  isActive: boolean;
  maxY: number;
}

export const Overlay = styled.div<OverlayDisplayProps>`
  display: ${(props) => (props.isActive ? "block" : "none")};
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: ${(props) => props.maxY}px;
  background-color: rgba(243, 43, 139, 0.1);
`;
