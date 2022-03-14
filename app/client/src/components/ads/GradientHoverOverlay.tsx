import styled from "styled-components";

export const GradientHoverOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
  z-index: 1;
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;
