import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import { Editor } from "@tinymce/tinymce-react";
import { Colors } from "constants/Colors";

const StyledRTEditor = styled.div<{
  isValid?: boolean;
}>`
  && {
    width: 100%;
    height: 100%;
    border: 1px solid
      ${(props) => (props.isValid ? "none" : Colors.DANGER_SOLID)};
    .tox .tox-editor-header {
      z-index: 0;
    }
  }
  .tox {
    .tox-tbtn {
      cursor: pointer;
      .tox-tbtn__select-label {
        cursor: inherit;
      }
    }
  }
`;

export interface RichtextEditorComponentProps {
  value?: string;
  isMarkdown: boolean;
  placeholder?: string;
  widgetId: string;
  isDisabled?: boolean;
  isVisible?: boolean;
  isToolbarHidden: boolean;
  isValid?: boolean;
  onValueChange: (valueAsString: string) => void;
}
const initValue = "<p></p>";
export function RichtextEditorComponent(props: RichtextEditorComponentProps) {
  const [value, setValue] = React.useState<string>(props.value as string);
  const editorRef = useRef<any>(null);
  const isInit = useRef<boolean>(false);

  const toolbarConfig =
    "insertfile undo redo | formatselect | bold italic backcolor forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image | removeformat | table | print preview media | forecolor backcolor emoticons' | help";

  useEffect(() => {
    if (!value && !props.value) return;
    // This Prevents calling onTextChange when initialized
    if (!isInit.current) return;
    const timeOutId = setTimeout(() => props.onValueChange(value), 1000);
    return () => clearTimeout(timeOutId);
  }, [value]);

  useEffect(() => {
    if (!editorRef.current) return;
    setValue(props.value as string);
  }, [props.value]);

  const onEditorChange = (newValue: string) => {
    // Prevents cursur shift in Markdown
    if (newValue === "" && props.isMarkdown) {
      setValue(initValue);
    } else {
      setValue(newValue);
    }
  };
  return (
    <StyledRTEditor
      className={`container-${props.widgetId}`}
      isValid={props.isValid}
    >
      <Editor
        disabled={props.isDisabled}
        id={`rte-${props.widgetId}`}
        init={{
          height: "100%",
          menubar: false,
          toolbar_mode: "sliding",
          forced_root_block: false,
          branding: false,
          resize: false,
          plugins: [
            "advlist autolink lists link image charmap print preview hr anchor pagebreak",
            "searchreplace visualblocks code fullscreen media",
            "insertdatetime media table paste code help",
          ],
        }}
        key={`editor_${props.isToolbarHidden}`}
        onEditorChange={onEditorChange}
        onInit={(evt, editor) => {
          editorRef.current = editor;
          isInit.current = true;
        }}
        tinymceScriptSrc="https://cdnjs.cloudflare.com/ajax/libs/tinymce/5.10.1/tinymce.min.js"
        toolbar={props.isToolbarHidden ? false : toolbarConfig}
        value={value}
      />
    </StyledRTEditor>
  );
}

export default RichtextEditorComponent;
