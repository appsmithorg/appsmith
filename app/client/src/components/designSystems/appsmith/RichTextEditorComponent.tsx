import React from "react";
import { Editor } from "@tinymce/tinymce-react";
require("tinymce/tinymce");
require("tinymce/themes/silver");

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
  return (
    <Editor
      value={props.defaultValue}
      disabled={props.isDisabled}
      init={{
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
          "undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help",
      }}
      onEditorChange={(content: any) => props.onValueChange(content)}
    />
  );
};

export default RichtextEditorComponent;
