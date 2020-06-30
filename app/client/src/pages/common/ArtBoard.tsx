import styled from "styled-components";
export default styled.div<{ width: number }>`
  width: ${props => props.width}px;
  margin: 0 auto;
  position: relative;
  padding: ${props => props.theme.canvasPadding};
`;
