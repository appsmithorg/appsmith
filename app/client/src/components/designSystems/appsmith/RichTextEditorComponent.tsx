import React, { useEffect, useState, useCallback } from "react";
import { debounce } from "lodash";
import { Editor } from "@tinymce/tinymce-react";
import styled from "styled-components";
const StyledRTEditor = styled.div`
  && {
    width: 100%;
    height: 100%;
    .tox .tox-editor-header {
      z-index: 0;
    }
  }
`;

export interface RichtextEditorComponentProps {
  defaultValue?: string;
  placeholder?: string;
  widgetId: string;
  isDisabled?: boolean;
  isVisible?: boolean;
  onValueChange: (valueAsString: string) => void;
}
export const RichtextEditorComponent = (
  props: RichtextEditorComponentProps,
) => {
  const [value, setValue] = useState(props.defaultValue);
  useEffect(() => {
    setValue(props.defaultValue);
  }, [props.defaultValue]);
  const onChange = useCallback(debounce(props.onValueChange, 300), [
    props.onValueChange,
  ]);
  const config = {
    height: "100%",
    menubar: false,
    branding: false,
    resize: false,
    plugins: [
      "advlist autolink lists link image charmap print preview anchor",
      "searchreplace visualblocks code fullscreen",
      "insertdatetime media table paste code help",
    ],
    toolbar:
      "undo redo | formatselect | bold italic backcolor forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help",
  };
  return (
    <StyledRTEditor>
      <Editor
        value={value}
        disabled={props.isDisabled}
        tinymceScriptSrc="/static/tinymce/tinymce.min.js"
        init={config}
        onEditorChange={content => {
          setValue(content);
          onChange(content);
        }}
      />
    </StyledRTEditor>
  );
};

export default RichtextEditorComponent;
