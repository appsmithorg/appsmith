import type { ChangeEvent } from "react";
import React from "react";
import type { EditorProps } from "components/editorComponents/CodeEditor";
import CodeEditor from "components/editorComponents/CodeEditor";
import {
  EditorModes,
  EditorSize,
  EditorTheme,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";

interface Props {
  input: {
    value: string;
    onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  };
  height: string;
  folding: boolean;
  showLineNumbers?: boolean;
  isReadOnly?: boolean;
  isRawView?: boolean;
  containerHeight?: number;
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
    isReadOnly: props.isReadOnly,
    isRawView: props.isRawView,
    containerHeight: props.containerHeight,
  };
  return <CodeEditor {...editorProps} />;
}

export default ReadOnlyEditor;
