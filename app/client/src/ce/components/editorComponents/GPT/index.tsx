import type { CodeEditorExpected } from "components/editorComponents/CodeEditor";
import type {
  FieldEntityInformation,
  TEditorModes,
} from "components/editorComponents/CodeEditor/EditorConfig";
import type { EntityNavigationData } from "entities/DataTree/dataTreeTypes";
import React, { useCallback, useEffect, useState } from "react";
import type CodeMirror from "codemirror";
import { useDispatch, useSelector } from "react-redux";
import { Button, Text } from "@appsmith/ads";
import styled from "styled-components";
import { fetchAIResponse } from "ee/actions/aiAssistantActions";
import {
  getAILastResponse,
  getIsAILoading,
  getAIError,
} from "ee/selectors/aiAssistantSelectors";
import { getAIContext } from "./trigger";

export type AIEditorContext = Partial<{
  functionName: string;
  cursorLineNumber: number;
  functionString: string;
  cursorPosition: CodeMirror.Position;
  cursorCoordinates: {
    left: number;
    top: number;
    bottom: number;
  };
  mode: string;
}>;

export interface TAIWrapperProps {
  children?: React.ReactNode;
  isOpen: boolean;
  currentValue: string;
  update?: (value: string) => void;
  triggerContext?: CodeEditorExpected;
  enableAIAssistance: boolean;
  dataTreePath?: string;
  mode: TEditorModes;
  entity: FieldEntityInformation;
  entitiesForNavigation: EntityNavigationData;
  editor: CodeMirror.Editor;
  onOpenChanged: (isOpen: boolean) => void;
}

const AIWindowContainer = styled.div<{ isOpen: boolean }>`
  display: ${(props) => (props.isOpen ? "flex" : "none")};
  position: absolute;
  top: ${(props) => (props.isOpen ? "0" : "-100%")};
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--ads-v2-color-bg);
  border: 1px solid var(--ads-v2-color-border);
  border-radius: var(--ads-v2-border-radius);
  z-index: 1000;
  flex-direction: column;
`;

const AIWindowHeader = styled.div`
  padding: var(--ads-v2-spaces-3);
  border-bottom: 1px solid var(--ads-v2-color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const AIWindowContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: var(--ads-v2-spaces-4);
  gap: var(--ads-v2-spaces-3);
  overflow-y: auto;
`;

const ResponseArea = styled.div`
  flex: 1;
  padding: var(--ads-v2-spaces-3);
  background: var(--ads-v2-color-bg-subtle);
  border-radius: var(--ads-v2-border-radius);
  min-height: 200px;
  white-space: pre-wrap;
  font-family: monospace;
`;

const InputArea = styled.div`
  display: flex;
  gap: var(--ads-v2-spaces-2);
  align-items: flex-end;
`;

const PromptTextarea = styled.textarea`
  flex: 1;
  padding: var(--ads-v2-spaces-2);
  border-radius: var(--ads-v2-border-radius);
  border: 1px solid var(--ads-v2-color-border);
  font-family: inherit;
  font-size: inherit;
  resize: vertical;
`;

export function AIWindow(props: TAIWrapperProps) {
  const {
    children,
    currentValue,
    editor,
    enableAIAssistance,
    isOpen,
    mode,
    onOpenChanged,
    update,
  } = props;

  const dispatch = useDispatch();
  const [prompt, setPrompt] = useState("");
  const lastResponse = useSelector(getAILastResponse);
  const isLoading = useSelector(getIsAILoading);
  const error = useSelector(getAIError);

  useEffect(
    function handleResponseChange() {
      if (lastResponse && update) {
        setPrompt("");
      }
    },
    [lastResponse, update],
  );

  const handleSend = useCallback(() => {
    if (!prompt.trim()) return;

    const cursorPosition = editor.getCursor();
    const context = getAIContext({
      cursorPosition,
      editor,
    });

    dispatch(
      fetchAIResponse({
        prompt: prompt.trim(),
        context: {
          ...context,
          currentValue,
          mode,
        },
      }),
    );
  }, [currentValue, dispatch, editor, mode, prompt]);

  const handleApply = useCallback(() => {
    if (lastResponse && update) {
      update(lastResponse);
      onOpenChanged(false);
    }
  }, [lastResponse, onOpenChanged, update]);

  const handleClose = useCallback(() => {
    onOpenChanged(false);
  }, [onOpenChanged]);

  const handlePromptChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setPrompt(event.target.value);
    },
    [],
  );

  if (!enableAIAssistance || !isOpen) {
    return children as React.ReactElement;
  }

  return (
    <>
      {children}
      <AIWindowContainer isOpen={isOpen}>
        <AIWindowHeader>
          <Text kind="heading-s">AI Assistant</Text>
          <Button kind="tertiary" onClick={handleClose} size="sm">
            Close
          </Button>
        </AIWindowHeader>
        <AIWindowContent>
          <ResponseArea>
            {isLoading && <Text>Thinking...</Text>}
            {error && <Text color="var(--ads-v2-color-fg-error)">{error}</Text>}
            {lastResponse && !isLoading && <Text>{lastResponse}</Text>}
            {!lastResponse && !isLoading && !error && (
              <Text color="var(--ads-v2-color-fg-muted)">
                Ask me anything about your code...
              </Text>
            )}
          </ResponseArea>
          <InputArea>
            <PromptTextarea
              onChange={handlePromptChange}
              placeholder="Describe what you want the code to do..."
              rows={3}
              value={prompt}
            />
            <Button
              isLoading={isLoading}
              kind="primary"
              onClick={handleSend}
              size="md"
            >
              Send
            </Button>
            {lastResponse && (
              <Button kind="secondary" onClick={handleApply} size="md">
                Apply
              </Button>
            )}
          </InputArea>
        </AIWindowContent>
      </AIWindowContainer>
    </>
  );
}
