import styled from "styled-components";

interface AutoHeightLimitOverlayDisplayProps {
  isActive: boolean;
  height: number;
}

const AutoHeightLimitOverlayDisplay = styled.div<
  AutoHeightLimitOverlayDisplayProps
>`
  display: ${(props) => (props.isActive ? "block" : "none")};
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: ${(props) => props.height}px;
  background-color: rgba(243, 43, 139, 0.1);
`;

export default AutoHeightLimitOverlayDisplay;
