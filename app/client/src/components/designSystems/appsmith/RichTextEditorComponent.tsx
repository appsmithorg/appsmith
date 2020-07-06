import React, { useEffect, useState } from "react";
import { debounce } from "lodash";
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
  const [editorInstance, setEditorInstance] = useState(null as any);
  useEffect(() => {
    if (editorInstance !== null) {
      editorInstance.mode.set(
        props.isDisabled === true ? "readonly" : "design",
      );
    }
  }, [props.isDisabled]);

  useEffect(() => {
    if (editorInstance !== null) {
      editorInstance.setContent(props.defaultValue, { format: "html" });
    }
  }, [props.defaultValue]);
  useEffect(() => {
    const onChange = debounce(props.onValueChange, 200);
    (window as any).tinyMCE.init({
      height: "100%",
      selector: `textarea#${props.widgetId}`,
      menubar: false,
      branding: false,
      resize: false,
      setup: (editor: any) => {
        editor.mode.set(props.isDisabled === true ? "readonly" : "design");
        // Without timeout default value is not set on browser refresh.
        setTimeout(() => {
          editor.setContent(props.defaultValue, { format: "html" });
        }, 300);
        editor
          .on("Change", () => {
            onChange(editor.getContent());
          })
          .on("Undo", () => {
            onChange(editor.getContent());
          })
          .on("Redo", () => {
            onChange(editor.getContent());
          })
          .on("KeyUp", () => {
            // console.log("change: ", editor.getContent())
            onChange(editor.getContent());
          });
        setEditorInstance(editor);
      },
      plugins: [
        "advlist autolink lists link image charmap print preview anchor",
        "searchreplace visualblocks code fullscreen",
        "insertdatetime media table paste code help",
      ],
      toolbar:
        "undo redo | formatselect | bold italic backcolor forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help",
    });

    return () => {
      editorInstance !== null && editorInstance.destroy();
    };
  }, []);
  return (
    <StyledRTEditor>
      <textarea id={props.widgetId}></textarea>
    </StyledRTEditor>
  );
};

export default RichtextEditorComponent;
