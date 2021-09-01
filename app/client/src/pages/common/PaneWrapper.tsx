import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import styled from "styled-components";

export default styled.div<{ themeMode?: EditorTheme }>`
  background-color: ${(props) => props.theme.colors.propertyPane.bg};
  border-radius: 0px;
  border-color: ${(props) => props.theme.colors.propertyPane.bg} !important;
  box-shadow: 12px 0px 28px rgba(0, 0, 0, 0.32) !important;
  padding: ${(props) => props.theme.spaces[5]}px
    ${(props) => props.theme.spaces[7]}px;
  color: ${(props) => props.theme.colors.propertyPane.label};
  text-transform: capitalize;
`;
