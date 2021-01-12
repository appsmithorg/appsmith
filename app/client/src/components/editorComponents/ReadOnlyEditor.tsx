import React, { ChangeEvent, useMemo } from "react";
import CodeEditor, {
  EditorProps,
} from "components/editorComponents/CodeEditor";
import {
  EditorModes,
  EditorSize,
  EditorTheme,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import { useSelector } from "react-redux";
import { getThemeDetails } from "selectors/themeSelectors";

interface Props {
  input: {
    value: string;
    onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  };
  height: string;
}

const ReadOnlyEditor = (props: Props) => {
  const themeMode = useSelector(getThemeDetails).mode;
  const theme = useMemo(() => {
    if (themeMode === "LIGHT") {
      return EditorTheme.LIGHT;
    } else {
      return EditorTheme.DARK;
    }
  }, [themeMode]);

  const editorProps: EditorProps = {
    hinting: [],
    input: props.input,
    marking: [],
    mode: EditorModes.JSON_WITH_BINDING,
    size: EditorSize.EXTENDED,
    tabBehaviour: TabBehaviour.INDENT,
    theme: theme,
    height: props.height,
    showLightningMenu: false,
    showLineNumbers: true,
    borderLess: true,
  };
  return <CodeEditor {...editorProps} />;
};

export default ReadOnlyEditor;
