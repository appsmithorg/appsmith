import React, { useCallback, useEffect, useRef } from "react";
import styled from "styled-components";
import { Button } from "@blueprintjs/core";
import JSONEditor, { JSONEditorMode } from "jsoneditor";
import "jsoneditor/dist/jsoneditor.css";
import copy from "copy-to-clipboard";

import { ComponentProps } from "widgets/BaseComponent";
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
  overflow: auto;
`;

const JsonEditorContainer = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  .ace_gutter-cell.ace_error {
    background: none;
  }

  .ace_tooltip {
    display: none !important;
  }
`;

const OverlaidDiv = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  opacity: 0.3;
  cursor: not-allowed;
`;

const MenuBarContainer = styled.div``;

const modes: JSONEditorMode[] = [
  "tree",
  "form",
  "view",
  "code",
  "text",
  "preview",
];

function JsonEditorComponent(props: JsonEditorComponentProps) {
  const {
    copyable,
    disabled,
    onChangeJSON,
    onChangeText,
    onSave,
    text,
  } = props;

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

  const handleSave = useCallback(() => {
    onSave();
  }, []);

  return (
    <Container>
      {disabled && <OverlaidDiv />}
      <MenuBarContainer>
        {copyable && (
          <Button
            icon="clipboard"
            onClick={handleCopyToClipboard}
            outlined
            text="Copy to clipboard"
          />
        )}
        <Button icon="floppy-disk" onClick={handleSave} outlined text="Save" />
      </MenuBarContainer>
      <JsonEditorContainer ref={containerRef} />
    </Container>
  );
}

export interface JsonEditorComponentProps extends ComponentProps {
  disabled?: boolean;
  copyable?: boolean;
  text: string;
  onChangeJSON: (json: any) => void;
  onChangeText: (text: string) => void;
  onSave: () => void;
}

export default JsonEditorComponent;
