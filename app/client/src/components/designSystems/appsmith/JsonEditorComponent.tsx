import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import JSONEditor, { JSONEditorMode } from "jsoneditor";
import "jsoneditor/dist/jsoneditor.css";

import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";

function isValidJSON(json: any) {
  try {
    JSON.parse(json);
    return true;
  } catch (e) {
    return false;
  }
}

const JsonEditorContainer = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
`;

export interface JsonEditorComponentProps extends ComponentProps {
  text: string;
  onChangeJSON: (json: any) => void;
  onChangeText: (text: string) => void;
}

const modes: JSONEditorMode[] = [
  "tree",
  "form",
  "view",
  "code",
  "text",
  "preview",
];

function JsonEditorComponent(props: JsonEditorComponentProps) {
  const { onChangeJSON, onChangeText, text } = props;

  const editorRef = useRef<JSONEditor>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const options = Object.assign({}, { modes, onChangeJSON, onChangeText });
    if (containerRef.current) {
      editorRef.current = new JSONEditor(containerRef.current, options);
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (editorRef.current) {
      if (text && isValidJSON(text)) {
        editorRef.current.setText(text);
        onChangeText(text);
      }
    }
  }, [text]);

  return <JsonEditorContainer ref={containerRef} />;
}

export default JsonEditorComponent;
