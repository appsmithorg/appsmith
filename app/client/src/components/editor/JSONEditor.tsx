import React from "react";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-textmate";

const aceOnBlur = (onBlur: any) => (_event: any, editor?: any) => {
  const value = editor.getValue();
  onBlur(value);
};
const JSONEditor = (props: any) => {
  const { input } = props;
  return (
    <AceEditor
      mode="json"
      theme="textmate"
      fontSize={14}
      showPrintMargin={true}
      showGutter={true}
      highlightActiveLine={true}
      width="100%"
      setOptions={{
        enableBasicAutocompletion: false,
        enableLiveAutocompletion: false,
        enableSnippets: false,
        showLineNumbers: true,
        tabSize: 2,
        useWorker: false,
      }}
      name={input.name}
      onBlur={aceOnBlur(input.onBlur)}
      onChange={input.onChange}
      onFocus={input.onFocus}
      value={input.value}
    />
  );
};

export default JSONEditor;
