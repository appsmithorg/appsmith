import styled from "styled-components";
export default styled.div<{ width: number }>`
  width: ${(props) => props.width}px;
  margin: 0 auto;
  position: relative;
  background: ${(props) => {
    return props.theme.colors.artboard;
  }};
  padding: ${(props) => props.theme.canvasPadding};
`;
