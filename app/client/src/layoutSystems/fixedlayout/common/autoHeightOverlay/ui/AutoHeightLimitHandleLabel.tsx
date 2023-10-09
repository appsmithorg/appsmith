import styled from "styled-components";

interface AutoHeightLimitHandleLabel {
  isActive: boolean;
}

const AutoHeightLimitHandleLabel = styled.div<AutoHeightLimitHandleLabel>`
  position: absolute;
  pointer-events: none;
  padding: 1px 4px;
  background: #191919;
  font-weight: 400;
  font-size: 10px;
  line-height: 16px;
  color: #ffffff;
  text-align: center;
  white-space: nowrap;
  left: 0px;
  transform: translate(calc(-100% - 4px), -2px);
  display: ${(props) => (props.isActive ? "initial" : "none")};
`;

export default AutoHeightLimitHandleLabel;
