import React from "react";
import MonacoEditor from "react-monaco-editor";

import styled from "styled-components";

const Wrapper = styled.div<{ height: number }>`
  height: ${props => props.height}px;
  overflow: auto;
`;

interface Props {
  input: {
    value: string;
    onChange?: (value: string) => void;
  };
  language: string;
  height: number;
  placeholder?: string;
}

const CodeEditor = (props: Props) => {
  const options = {
    selectOnLineNumbers: true,
    minimap: { enabled: false },
    readOnly: !props.input.onChange,
  };
  return (
    <Wrapper height={props.height}>
      <MonacoEditor
        language={props.language}
        theme="vs-light"
        value={props.input.value}
        options={options}
        onChange={props.input.onChange}
      />
    </Wrapper>
  );
};

export default CodeEditor;
