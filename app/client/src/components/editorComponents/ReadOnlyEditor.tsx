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

interface Props {
  input: {
    value: string;
    onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  };
  height: string;
  folding: boolean;
  showLineNumbers?: boolean;
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
  };
  return <CodeEditor {...editorProps} />;
}

export default ReadOnlyEditor;
