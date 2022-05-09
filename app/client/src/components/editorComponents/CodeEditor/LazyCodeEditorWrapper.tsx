import React, { useState } from "react";
import CodeEditor from "components/editorComponents/CodeEditor";
import { EditorWrapper, ReadOnlyInput } from "./styledComponents";
import { replayHighlightClass } from "globalStyles/portals";

// Lazy load CodeEditor upon focus
function LazyCodeEditorWrapper(props: any) {
  const [isFocused, setFocus] = useState<boolean>(false);
  const handleFocus = (): void => {
    setFocus(true);
  };
  return isFocused ? (
    <CodeEditor {...props} />
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
        className="t--code-editor-wrapper unfocused-code-editor"
        data-testid="lazy-code-editor"
        onFocus={handleFocus}
        placeholder={props.placeholder}
        type="text"
        value={JSON.stringify(props.input.value, null, 2)}
      />
    </EditorWrapper>
  );
}

export default LazyCodeEditorWrapper;
