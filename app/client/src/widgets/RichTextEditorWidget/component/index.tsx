import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import { Editor } from "@tinymce/tinymce-react";

const StyledRTEditor = styled.div`
  && {
    width: 100%;
    height: 100%;
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
  defaultValue?: string;
  placeholder?: string;
  widgetId: string;
  isDisabled?: boolean;
  defaultText?: string;
  isVisible?: boolean;
  isToolbarHidden: boolean;
  onValueChange: (valueAsString: string) => void;
}
export function RichtextEditorComponent(props: RichtextEditorComponentProps) {
  const [value, setValue] = React.useState<string>(props.defaultText as string);
  const editorRef = useRef<any>(null);
  const isInit = useRef<boolean>(false);

  const toolbarConfig =
    "undo redo | formatselect | bold italic backcolor forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | table | help";

  useEffect(() => {
    if (!value) return;
    // Prevent calling onTextChange when initialized
    if (!isInit.current) return;
    const timeOutId = setTimeout(() => props.onValueChange(value), 1000);
    return () => clearTimeout(timeOutId);
  }, [value]);

  useEffect(() => {
    if (!props.defaultText) return;
    setValue(props.defaultText);
  }, [props.defaultText]);

  const onEditorChange = (newValue: string) => {
    if (!isInit.current) {
      isInit.current = true;
      return;
    }
    if (newValue === value) return;
    setValue(newValue);
  };
  return (
    <StyledRTEditor className={`container-${props.widgetId}`}>
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
            "advlist autolink lists link image charmap print preview anchor",
            "searchreplace visualblocks code fullscreen",
            "insertdatetime media table paste code help",
          ],
        }}
        key={`editor_${props.isToolbarHidden}`}
        onEditorChange={onEditorChange}
        onInit={(evt, editor) => {
          editorRef.current = editor;
        }}
        tinymceScriptSrc="https://cdnjs.cloudflare.com/ajax/libs/tinymce/5.10.1/tinymce.min.js"
        toolbar={props.isToolbarHidden ? false : toolbarConfig}
        value={value}
      />
    </StyledRTEditor>
  );
}

export default RichtextEditorComponent;
