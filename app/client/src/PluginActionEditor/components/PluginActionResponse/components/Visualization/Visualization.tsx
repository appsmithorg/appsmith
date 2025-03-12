import { Button, Flex } from "@appsmith/ads";
import type { ActionResponse } from "api/ActionAPI";
import { type Action } from "entities/Action";
import React, { useState } from "react";
import { parseActionResponse } from "../Response/utils";
import { EmptyVisualization } from "./components/EmptyVisualization";
import { LoadingOverlay } from "./components/LoadingOverlay";
import { PromptInput } from "./components/PromptInput";
import { Result } from "./components/Result";
import { SuggestionButtons } from "./components/SuggestionButtons";
import { useGenerateVisualization } from "./useGenerateVisualization";
import { useSaveVisualization } from "./useSaveVisualization";
import { ErrorBoundary } from "@sentry/react";

interface VisualizationProps {
  action: Action;
  actionResponse?: ActionResponse;
}

const BOTTOM_BAR_HEIGHT = 37;

export const Visualization = (props: VisualizationProps) => {
  const { action, actionResponse } = props;
  const [prompt, setPrompt] = useState("");
  const { response } = parseActionResponse(actionResponse);
  const generateVisualization = useGenerateVisualization(
    action.id,
    action.visualization?.result,
  );
  const saveVisualization = useSaveVisualization(action.id);

  return (
    // TODO: Remove the hardcoded height
    <Flex
      flexDirection="column"
      height={`calc(100% - ${BOTTOM_BAR_HEIGHT}px)`}
      position="relative"
    >
      <Flex
        borderBottom="1px solid var(--ads-v2-color-border-muted)"
        flexDirection="column"
        gap="spaces-3"
        padding="spaces-3"
      >
        <SuggestionButtons onApply={setPrompt} />
        <Flex gap="spaces-3">
          <PromptInput
            isDisabled={!response || saveVisualization.isLoading}
            isLoading={generateVisualization.isLoading}
            onChange={setPrompt}
            onSubmit={async () =>
              generateVisualization.execute(prompt, response)
            }
            value={prompt}
          />
          <Button
            isDisabled={
              generateVisualization.isLoading ||
              saveVisualization.isLoading ||
              !generateVisualization.hasPrevious
            }
            isIconButton
            kind="secondary"
            onClick={generateVisualization.previous}
            size="md"
            startIcon="arrow-go-back"
          />
          <Button
            isDisabled={
              generateVisualization.isLoading ||
              saveVisualization.isLoading ||
              !generateVisualization.hasNext
            }
            isIconButton
            kind="secondary"
            onClick={generateVisualization.next}
            size="md"
            startIcon="arrow-go-forward"
          />
          <Button
            isDisabled={
              generateVisualization.isLoading ||
              saveVisualization.isLoading ||
              !generateVisualization.elements
            }
            isLoading={saveVisualization.isLoading}
            kind="secondary"
            onClick={async () =>
              generateVisualization.elements &&
              saveVisualization.execute(generateVisualization.elements)
            }
            size="md"
          >
            Save
          </Button>
        </Flex>
      </Flex>

      <Flex flexDirection="column" flexGrow={1} position="relative">
        {generateVisualization.elements ? (
          <ErrorBoundary fallback="Visualization failed. Please try again.">
            <Result data={response} elements={generateVisualization.elements} />
          </ErrorBoundary>
        ) : (
          <EmptyVisualization />
        )}
        {generateVisualization.isLoading && <LoadingOverlay />}
      </Flex>
    </Flex>
  );
};
