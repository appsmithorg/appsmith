import styled from "styled-components";
export default styled.div<{ width: number }>`
  width: ${props => props.width}px;
  height: 100%;
  margin: 0 auto;
  position: relative;
`;
