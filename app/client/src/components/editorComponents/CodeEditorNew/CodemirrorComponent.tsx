import React from "react";
import useCodeMirror from "./useCodeMirror";
import { Extension } from "@codemirror/state";
type CodeMirrorProps = {
  extensions: Extension[];
};

const CodeMirror = ({ extensions }: CodeMirrorProps) => {
  const { ref: codeMirrorRef } = useCodeMirror(extensions);

  return <div ref={codeMirrorRef} />;
};

export default CodeMirror;
