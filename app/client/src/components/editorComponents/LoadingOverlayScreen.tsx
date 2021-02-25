import styled from "styled-components";
import { EditorTheme } from "./CodeEditor/EditorConfig";

export default styled.div<{ theme?: EditorTheme }>`
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
  background-color: ${(props) =>
    props.theme === EditorTheme.DARK
      ? "rgba(0, 0, 0, 0.8)"
      : "rgba(255, 255, 255, 0.8)"};
  pointer-events: none;
  z-index: 10;
  color: ${(props) =>
    props.theme === EditorTheme.DARK ? "#FFFFFF" : "#000000"};
  display: flex;
  align-items: center;
  justify-content: center;
`;
