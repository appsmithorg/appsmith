import React, { useState } from "react";
import CodeEditor, {
  CodeEditorExpected,
} from "components/editorComponents/CodeEditor";
import {
  CodeEditorBorder,
  EditorModes,
  EditorSize,
  EditorTheme,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import { EditorWrapper, ReadOnlyInput } from "./styledComponents";
import { replayHighlightClass } from "globalStyles/portals";

function CodeEditorWrapper(props: any) {
  const [isFocused, setFocus] = useState<boolean>(false);
  const handleFocus = (): void => {
    setFocus(true);
  };
  return isFocused ? (
    <CodeEditor
      {...props}
      additionalDynamicData={props.additionalAutocomplete}
      border={CodeEditorBorder.ALL_SIDE}
      hoverInteraction
      input={{
        value: props.value,
        onChange: props.onChange,
      }}
      isEditorHidden={!props.isOpen}
      mode={EditorModes.TEXT_WITH_BINDING}
      size={EditorSize.EXTENDED}
      tabBehaviour={TabBehaviour.INDENT}
      theme={props.theme || EditorTheme.LIGHT}
    />
  ) : (
    <EditorWrapper
      border={props.border}
      borderLess={props.borderLess}
      className={`${props.className} ${replayHighlightClass} ${
        false ? "t--codemirror-has-error" : ""
      }`}
      codeEditorVisibleOverflow={props.codeEditorVisibleOverflow}
      disabled={props.disabled}
      editorTheme={props.theme}
      fill={props.fill}
      hasError={false}
      height={props.height}
      hoverInteraction={props.hoverInteraction}
      isFocused={isFocused}
      isNotHover={false}
      isRawView={false}
      isReadOnly={false}
      size={props.size}
    >
      <ReadOnlyInput
        className="t--code-editor-wrapper"
        onFocus={handleFocus}
        placeholder={props.placeholder}
        type="text"
        value={props.value}
      />
    </EditorWrapper>
  );
}

export default CodeEditorWrapper;
