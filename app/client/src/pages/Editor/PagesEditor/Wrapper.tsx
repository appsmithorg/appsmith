import styled from "styled-components";

const PageEditorWrapper = styled.div`
  padding: 20px;
  margin-left: 250px;
  position: absolute;
  left: 0;
  width: calc(100% - 250px);
  z-index: 2;
  height: calc(100% - 35px);
  overflow-y: scroll;
  background-color: ${(props) => props.theme.colors.artboard};
`;

export default PageEditorWrapper;
