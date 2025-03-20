import React, { useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Rnd } from "react-rnd";
import { Button, Flex, Icon } from "@appsmith/ads";
import type { EventOrValueHandler } from "redux-form";
import type { ChangeEvent } from "react";
import { Text } from "@appsmith/ads";
import LazyCodeEditor from "components/editorComponents/LazyCodeEditor";
import type {
  CodeEditorExpected,
  EditorProps,
} from "components/editorComponents/CodeEditor";
import type { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import {
  EditorModes,
  EditorSize,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import type { AdditionalDynamicDataTree } from "utils/autocomplete/customTreeTypeDefCreator";
import * as Styled from "./styles";

export interface PopoutEditorProps extends Partial<EditorProps> {
  widgetName: string;
  label: string;
  value: string;
  onChange: EventOrValueHandler<ChangeEvent<HTMLTextAreaElement>>;
  theme: EditorTheme;
  onClose: () => void;
  additionalAutocomplete?: AdditionalDynamicDataTree;
  dataTreePath?: string;
  expected?: CodeEditorExpected;
  hideEvaluatedValue?: boolean;
}

const defaultPosition = {
  x: Math.max((window.innerWidth - 600) / 2, 0),
  y: Math.max((window.innerHeight - 400) / 2, 0),
  width: 600,
  height: 400,
};

export function PopoutEditor(props: PopoutEditorProps) {
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

  const handleClose = useCallback(() => {
    setIsOpen(false);
    onClose();
  }, [onClose]);

  const input = useMemo(() => {
    return {
      value: value,
      onChange: onChange,
    };
  }, [value, onChange]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <Styled.Backdrop>
      <Rnd
        bounds="window"
        default={defaultPosition}
        dragHandleClassName="popout-header"
        minHeight={300}
        minWidth={400}
      >
        <Styled.PopoutContainer>
          <Styled.Header className="popout-header">
            <Flex alignItems="center" flexDirection="row">
              <Icon
                color="var(--ads-v2-color-fg-subtle)"
                name="drag-control"
                size="md"
              />
              <Text color="var(--ads-v2-color-fg-subtle)" kind="heading-xs">
                {widgetName}&nbsp;/
              </Text>
              <Text kind="heading-xs">&nbsp;{label}</Text>
            </Flex>
            <Button
              isIconButton
              kind="tertiary"
              onClick={handleClose}
              size="sm"
              startIcon="close-x"
            />
          </Styled.Header>
          <Styled.EditorContainer className="resize-handle">
            <LazyCodeEditor
              additionalDynamicData={additionalAutocomplete}
              borderLess
              dataTreePath={dataTreePath}
              expected={expected}
              hideEvaluatedValue={hideEvaluatedValue}
              input={input}
              mode={EditorModes.TEXT_WITH_BINDING}
              size={EditorSize.EXTENDED}
              tabBehaviour={TabBehaviour.INDENT}
              theme={theme}
              {...editorProps}
              height={325}
            />
          </Styled.EditorContainer>
        </Styled.PopoutContainer>
      </Rnd>
    </Styled.Backdrop>,
    document.body,
  );
}
