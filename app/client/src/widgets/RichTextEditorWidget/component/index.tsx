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
  const [value, setValue] = React.useState<string>();
  const editorRef = useRef<any>(null);

  const toolbarConfig =
    "undo redo | formatselect | bold italic backcolor forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | table | help";

  useEffect(() => {
    const timeOutId = setTimeout(
      () => props.onValueChange(value as string),
      1000,
    );
    return () => clearTimeout(timeOutId);
  }, [value]);

  useEffect(() => {
    setValue(props.defaultText);
  }, [props.defaultText]);
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
        onEditorChange={(newValue) => {
          if (newValue === value) return;
          setValue(newValue);
        }}
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
