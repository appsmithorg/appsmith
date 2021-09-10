import React, { useCallback, useEffect, useRef } from "react";
import styled from "styled-components";
import { Button } from "@blueprintjs/core";
import JSONEditor, { JSONEditorMode } from "jsoneditor";
import "jsoneditor/dist/jsoneditor.css";
import copy from "copy-to-clipboard";

import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";

function isValidJSON(json: any) {
  try {
    JSON.parse(json);
    return true;
  } catch (e) {
    return false;
  }
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
`;

const JsonEditorContainer = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
`;

const MenuBarContainer = styled.div``;

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
    const options = { modes, onChangeJSON, onChangeText };

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

  const handleCopyToClipboard = useCallback(() => {
    let json = "";
    if (editorRef.current) {
      json = JSON.stringify(editorRef.current.get(), null, 2);
    }

    copy(json);
    Toaster.show({
      text: "JSON has been copied",
      variant: Variant.success,
    });
  }, []);

  return (
    <Container>
      <MenuBarContainer>
        <Button
          icon="clipboard"
          onClick={handleCopyToClipboard}
          outlined
          text="Copy to clipboard"
        />
      </MenuBarContainer>
      <JsonEditorContainer ref={containerRef} />
    </Container>
  );
}

export default JsonEditorComponent;
