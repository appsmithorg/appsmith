import React, { ChangeEvent } from "react";
import CodeEditor, {
  EditorProps,
} from "components/editorComponents/CodeEditor";
import {
  EditorModes,
  EditorSize,
  EditorTheme,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import "codemirror/addon/fold/brace-fold";
import "codemirror/addon/fold/foldgutter";
import "codemirror/addon/fold/foldgutter.css";

interface Props {
  input: {
    value: string;
    onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  };
  height: string;
  folding: boolean;
}

const ReadOnlyEditor = (props: Props) => {
  const editorProps: EditorProps = {
    hinting: [],
    input: props.input,
    marking: [],
    mode: EditorModes.JSON_WITH_BINDING,
    size: EditorSize.EXTENDED,
    tabBehaviour: TabBehaviour.INDENT,
    theme: EditorTheme.LIGHT,
    height: props.height,
    showLightningMenu: false,
    showLineNumbers: true,
    borderLess: true,
    folding: props.folding,
  };
  return <CodeEditor {...editorProps} />;
};

export default ReadOnlyEditor;
