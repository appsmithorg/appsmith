import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Rnd } from "react-rnd";
import styled from "styled-components";
import { Button } from "@appsmith/ads";
import type { EventOrValueHandler } from "redux-form";
import type { ChangeEvent } from "react";
import LazyCodeEditor from "../editorComponents/LazyCodeEditor";
import type {
  CodeEditorExpected,
  EditorProps,
} from "../editorComponents/CodeEditor";
import type { EditorTheme } from "../editorComponents/CodeEditor/EditorConfig";
import {
  EditorModes,
  EditorSize,
  TabBehaviour,
} from "../editorComponents/CodeEditor/EditorConfig";
import type { AdditionalDynamicDataTree } from "../../utils/autocomplete/customTreeTypeDefCreator";

const Backdrop = styled.div`
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PopoutContainer = styled.div`
  background: var(--ads-v2-color-bg);
  border: 1px solid var(--ads-v2-color-border);
  border-radius: var(--ads-v2-border-radius);
  box-shadow: var(--ads-v2-shadow-popovers);
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
  position: relative;
  z-index: 21;
`;

const Header = styled.div`
  padding: var(--ads-v2-spaces-3);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--ads-v2-color-bg-subtle);
  border-bottom: 1px solid var(--ads-v2-color-border);
  cursor: move;
`;

const HeaderTitle = styled.div`
  color: var(--ads-v2-color-fg);
  font-size: var(--ads-v2-font-size-4);
  font-weight: var(--ads-v2-font-weight-bold);
`;

const EditorContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: var(--ads-v2-spaces-3);
`;

export interface PopoutResizableEditorProps extends Partial<EditorProps> {
  widgetName: string;
  label: string;
  value: string;
  onChange: EventOrValueHandler<ChangeEvent<HTMLTextAreaElement>>;
  theme: EditorTheme;
  onClose: () => void;
  additionalAutocomplete?: AdditionalDynamicDataTree; // Match InputTextControl prop name
  dataTreePath?: string;
  expected?: CodeEditorExpected;
  hideEvaluatedValue?: boolean;
}

export default function PopoutResizableEditor(
  props: PopoutResizableEditorProps,
) {
  const {
    additionalAutocomplete,
    dataTreePath,
    expected,
    hideEvaluatedValue,
    label,
    onChange,
    onClose,
    theme,
    value,
    widgetName,
    ...editorProps
  } = props;
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <Backdrop onClick={handleClose}>
      <Rnd
        bounds="window"
        default={{
          x: Math.max((window.innerWidth - 600) / 2, 0),
          y: Math.max((window.innerHeight - 400) / 2, 0),
          width: 600,
          height: 400,
        }}
        dragHandleClassName="popout-header"
        minHeight={300}
        minWidth={400}
        onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}
      >
        <PopoutContainer>
          <Header className="popout-header">
            <HeaderTitle>
              {widgetName} / {label}
            </HeaderTitle>
            <Button
              isIconButton
              kind="tertiary"
              onClick={handleClose}
              size="sm"
              startIcon="close-x"
            />
          </Header>
          <EditorContainer>
            <LazyCodeEditor
              additionalDynamicData={additionalAutocomplete}
              dataTreePath={dataTreePath}
              expected={expected}
              hideEvaluatedValue={hideEvaluatedValue}
              input={{
                value: value,
                onChange: onChange,
              }}
              mode={EditorModes.TEXT_WITH_BINDING}
              size={EditorSize.EXTENDED}
              tabBehaviour={TabBehaviour.INDENT}
              theme={theme}
              {...editorProps}
            />
          </EditorContainer>
        </PopoutContainer>
      </Rnd>
    </Backdrop>,
    document.body,
  );
}
