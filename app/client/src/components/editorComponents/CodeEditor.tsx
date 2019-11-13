import React from "react";
import MonacoEditor from "react-monaco-editor";

import styled from "styled-components";
import { editor } from "monaco-editor";

const Wrapper = styled.div<{ height: number }>`
  height: ${props => props.height}px;
  overflow: auto;
  color: white;
`;

interface Props {
  input: {
    value: string;
    onChange?: (value: string) => void;
  };
  language: string;
  height: number;
  placeholder?: string;
  lineNumbers?: "on" | "off";
  glyphMargin?: boolean;
  folding?: boolean;
  lineDecorationsWidth?: number;
  lineNumbersMinChars?: number;
  theme?: "LIGHT" | "DARK";
}

const CodeEditor = (props: Props) => {
  const options: editor.IEditorConstructionOptions = {
    wordWrap: "on",
    wrappingIndent: "indent",
    selectOnLineNumbers: true,
    minimap: { enabled: false },
    readOnly: !props.input.onChange,
    lineNumbers: props.lineNumbers,
    glyphMargin: props.glyphMargin,
    folding: props.folding,
    // // Undocumented see https://github.com/Microsoft/vscode/issues/30795#issuecomment-410998882
    lineDecorationsWidth: props.lineDecorationsWidth,
    lineNumbersMinChars: props.lineNumbersMinChars,
  };
  return (
    <Wrapper height={props.height}>
      <MonacoEditor
        language={props.language}
        theme={props.theme ? props.theme : "LIGHT"}
        value={props.input.value}
        options={options}
        onChange={props.input.onChange}
      />
    </Wrapper>
  );
};

export default CodeEditor;
