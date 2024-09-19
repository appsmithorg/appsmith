import type { ChangeEvent } from "react";
import React from "react";
import type { EditorProps } from "components/editorComponents/CodeEditor";
import {
  CodeEditorBorder,
  EditorModes,
  EditorSize,
  EditorTheme,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import LazyCodeEditor from "./LazyCodeEditor";

interface Props {
  input: {
    value: string;
    onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  };
  height: string;
  folding: boolean;
  showLineNumbers?: boolean;
  isRawView?: boolean;
}

function ReadOnlyEditor(props: Props) {
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
    showLineNumbers: props.hasOwnProperty("showLineNumbers")
      ? props.showLineNumbers
      : true,
    borderLess: true,
    folding: props.folding,
    isReadOnly: true,
    isRawView: props.isRawView,
    border: CodeEditorBorder.NONE,
  };

  return <LazyCodeEditor {...editorProps} />;
}

export default ReadOnlyEditor;
