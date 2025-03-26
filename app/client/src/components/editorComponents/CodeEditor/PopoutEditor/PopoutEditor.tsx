// React and core libraries
import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

// Third-party libraries
import { Rnd } from "react-rnd";
import { useDebounceValue } from "usehooks-ts";
import { Button, Flex, Icon, Text } from "@appsmith/ads";

// Application-specific imports
import LazyCodeEditor from "components/editorComponents/LazyCodeEditor";
import {
  EditorModes,
  EditorSize,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";

// Type imports
import type { EventOrValueHandler } from "redux-form";
import type { ChangeEvent } from "react";
import type {
  CodeEditorExpected,
  EditorProps,
} from "components/editorComponents/CodeEditor";
import type { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import type { AdditionalDynamicDataTree } from "utils/autocomplete/customTreeTypeDefCreator";

// Imports with relative paths
import * as Styled from "./styles";
import {
  RND_CONFIG,
  RESIZE_DEBOUNCE_TIMEOUT,
  DRAG_HANDLE_CLASS_NAME,
  RESIZE_HANDLE_STYLES,
  RESIZE_HANDLE_CLASS_NAME,
} from "./constants";

export interface PopoutEditorProps extends Partial<EditorProps> {
  additionalAutocomplete?: AdditionalDynamicDataTree;
  dataTreePath?: string;
  expected?: CodeEditorExpected;
  hideEvaluatedValue?: boolean;
  label: string;
  onChange: EventOrValueHandler<ChangeEvent<HTMLTextAreaElement>>;
  onClose: () => void;
  theme: EditorTheme;
  value: string;
  widgetName?: string;
}

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

  const defaultPosition = useMemo(() => {
    const { defaultHeight, defaultWidth } = RND_CONFIG;

    return {
      x: Math.max((window.innerWidth - defaultWidth) / 2, 0),
      y: Math.max((window.innerHeight - defaultHeight) / 2, 0),
      width: defaultWidth,
      height: defaultHeight,
    };
  }, []);

  const input = useMemo(
    () => ({
      onChange: onChange,
      value: value,
    }),
    [onChange, value],
  );

  const title = useMemo(() => {
    if (widgetName) {
      return (
        <>
          <Text color="var(--ads-v2-color-fg-subtle)" kind="heading-xs">
            {widgetName}&nbsp;/
          </Text>
          <Text kind="heading-xs">&nbsp;{label}</Text>
        </>
      );
    }

    return <Text kind="heading-xs">&nbsp;{label}</Text>;
  }, [label, widgetName]);

  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [editorContainerHeight, setEditorContainerHeight] =
    useDebounceValue<number>(RND_CONFIG.defaultHeight, RESIZE_DEBOUNCE_TIMEOUT);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    onClose();
  }, [onClose]);

  useLayoutEffect(
    function measureEditorContainerEffect() {
      const container = editorContainerRef.current;

      if (container) {
        const resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            setEditorContainerHeight(entry.contentRect.height);
          }
        });

        resizeObserver.observe(container);

        return () => {
          resizeObserver.disconnect();
        };
      }
    },
    [setEditorContainerHeight],
  );

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <Styled.Backdrop>
      <Rnd
        bounds="window"
        className="pointer-events-auto"
        default={defaultPosition}
        dragHandleClassName={DRAG_HANDLE_CLASS_NAME}
        minHeight={RND_CONFIG.minHeight}
        minWidth={RND_CONFIG.minWidth}
        resizeHandleStyles={RESIZE_HANDLE_STYLES}
      >
        <Styled.PopoutContainer>
          <Styled.Header className={DRAG_HANDLE_CLASS_NAME}>
            <Flex alignItems="center" flexDirection="row">
              <Icon
                color="var(--ads-v2-color-fg-subtle)"
                name="drag-control"
                size="md"
              />
              {title}
            </Flex>
            <Button
              isIconButton
              kind="tertiary"
              onClick={handleClose}
              size="sm"
              startIcon="close-x"
            />
          </Styled.Header>
          <Styled.EditorContainer
            className={RESIZE_HANDLE_CLASS_NAME}
            ref={editorContainerRef}
          >
            <LazyCodeEditor
              additionalDynamicData={additionalAutocomplete}
              borderLess
              dataTreePath={dataTreePath}
              expected={expected}
              height={editorContainerHeight}
              hideEvaluatedValue={hideEvaluatedValue}
              input={input}
              mode={EditorModes.TEXT_WITH_BINDING}
              size={EditorSize.EXTENDED}
              tabBehaviour={TabBehaviour.INDENT}
              theme={theme}
              {...editorProps}
            />
          </Styled.EditorContainer>
        </Styled.PopoutContainer>
      </Rnd>
    </Styled.Backdrop>,
    document.body,
  );
}
