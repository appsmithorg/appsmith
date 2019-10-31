import React from "react";
// import Editor from "react-simple-code-editor";
// import { highlight, languages } from "prismjs/components/prism-core";
// import "prismjs/components/prism-clike";
// import "prismjs/components/prism-json";
// import "prismjs/components/prism-markup";
// import "prismjs/themes/prism.css";
// import { theme } from "../../constants/DefaultTheme";
import MonacoEditor from "react-monaco-editor";

import styled from "styled-components";

const Wrapper = styled.div`
  height: 500px;
  overflow: auto;
`;

interface Props {
  input: {
    value: string;
    onChange?: (value: string) => void;
  };
  placeholder?: string;
}

const CodeEditor = (props: Props) => {
  const options = {
    selectOnLineNumbers: true,
    minimap: { enabled: false },
    readOnly: !props.input.onChange,
  };
  return (
    <Wrapper>
      <MonacoEditor
        language="json"
        theme="vs-light"
        value={props.input.value}
        options={options}
        onChange={props.input.onChange}
      />
    </Wrapper>
  );
};

export default CodeEditor;
