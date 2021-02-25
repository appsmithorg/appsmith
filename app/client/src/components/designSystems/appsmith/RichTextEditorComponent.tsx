import React, { useEffect, useState, useRef } from "react";
import { debounce } from "lodash";
import styled from "styled-components";
import { useScript, ScriptStatus } from "utils/hooks/useScript";

import { isString } from "utils/helpers";

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
  const status = useScript(
    "https://cdnjs.cloudflare.com/ajax/libs/tinymce/5.7.0/tinymce.min.js",
  );

  const [isEditorInitialised, setIsEditorInitialised] = useState(false);
  const [editorInstance, setEditorInstance] = useState(null as any);

  /* Using editorContent as a variable to save editor content locally to verify against new content*/
  const editorContent = useRef("");
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (editorInstance !== null) {
      editorInstance.mode.set(
        props.isDisabled === true ? "readonly" : "design",
      );
    }
  }, [props.isDisabled, editorInstance, isEditorInitialised]);

  useEffect(() => {
    if (
      editorInstance !== null &&
      (editorContent.current.length === 0 ||
        editorContent.current !== props.defaultValue)
    ) {
      const content = getContent();

      editorInstance.setContent(content, {
        format: "html",
      });
    }
  }, [props.defaultValue, editorInstance, isEditorInitialised]);
  useEffect(() => {
    if (status !== ScriptStatus.READY) return;
    const onChange = debounce((content: string) => {
      editorContent.current = content;
      props.onValueChange(content);
    }, 200);
    const selector = `textarea#rte-${props.widgetId}`;
    (window as any).tinyMCE.init({
      forced_root_block: false,
      height: "100%",
      selector: selector,
      menubar: false,
      branding: false,
      resize: false,
      setup: (editor: any) => {
        editor.mode.set(props.isDisabled === true ? "readonly" : "design");
        const content = getContent();
        editor.setContent(content, { format: "html" });
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
            onChange(editor.getContent());
          });
        setEditorInstance(editor);
        editor.on("init", () => {
          setIsEditorInitialised(true);
        });
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
      (window as any).tinyMCE.EditorManager.remove(selector);
      editorInstance !== null && editorInstance.remove();
    };
  }, [status]);

  /**
   * get content for rich text editor
   */
  const getContent = () => {
    return props.defaultValue && isString(props.defaultValue)
      ? props.defaultValue.replace(/\n/g, "<br/>")
      : props.defaultValue;
  };

  if (status !== ScriptStatus.READY) return null;

  return (
    <StyledRTEditor>
      <textarea id={`rte-${props.widgetId}`}></textarea>
    </StyledRTEditor>
  );
};

export default RichtextEditorComponent;
