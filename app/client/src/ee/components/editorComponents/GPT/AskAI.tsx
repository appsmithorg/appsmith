import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useState } from "react";
import styled from "styled-components";
import classNames from "classnames";
import type { TAssistantPrompt, TChatGPTPrompt } from "./utils";
import {
  getAllPossibleBindingsForSuggestions,
  chatGenerationApi,
  getErrorMessage,
  getFormattedCode,
  GPTTask,
} from "./utils";
import { useTextAutocomplete } from "./utils";
import { useGPTTask } from "./utils";
import { useGPTContextGenerator } from "./utils";
import AnalyticsUtil from "utils/AnalyticsUtil";
import BetaCard from "components/editorComponents/BetaCard";
import { Button, Callout, Text } from "design-system";
import { usePrevious } from "@mantine/hooks";
import { APPSMITH_AI_LINK } from "./constants";
import type { TAIWrapperProps } from "@appsmith/components/editorComponents/GPT";
import { useSelector } from "react-redux";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import {
  getAISuggestedPromptShownForType,
  getApplicationAIRecentQueriesByType,
  setAIRecentQuery,
  setAISuggestedPromptShownForType,
} from "utils/storage";
import { getPlatformFunctions } from "@appsmith/workers/Evaluation/fns";
import { getConfigTree, getDataTree } from "selectors/dataTreeSelectors";
import { getEntityInCurrentPath } from "sagas/RecentEntitiesSagas";
import { useLocation } from "react-router";

import { PromptTriggers } from "./constants";

const QueryForm = styled.form`
  > div {
    border-radius: var(--ads-v2-border-radius);
    border: 1px solid var(--ads-v2-color-border);
    color: var(--ads-v2-color-fg-muted);
    &:focus-within {
      border: 1px solid var(--ads-v2-color-border-emphasis-plus);
      outline: var(--ads-v2-border-width-outline) solid
        var(--ads-v2-color-outline);
      outline-offset: var(--ads-v2-offset-outline);
    }
    &.disabled {
      opacity: var(--ads-v2-opacity-disabled);
    }
  }
  textarea {
    color: var(--ads-v2-color-fg);
    background: transparent;
    z-index: 2;
    font-size: 14px;
    padding: 6px 0;
    line-height: 16px;
    padding-right: 8px;
  }
  .autocomplete-overlay {
    color: #afafaf;
    position: absolute;
    padding: 6px 0;
    font-size: 14px;
    padding-right: 8px;
    line-height: 16px;
    z-index: 1;
    top: 0;
  }
`;

const resizeTextArea = (el: React.RefObject<HTMLTextAreaElement>) => {
  if (!el.current) return;
  el.current.style.height = "";
  el.current.style.height = el.current.scrollHeight + "px";
};

const CHARACTER_LIMIT = 500;

type TAskAIProps = Omit<TAIWrapperProps, "enableAIAssistance" | "children">;

export function AskAI(props: TAskAIProps) {
  const { close, currentValue, dataTreePath } = props;
  const ref = useRef<HTMLDivElement>(null);
  const contextGenerator = useGPTContextGenerator(
    props.dataTreePath,
    props.triggerContext,
  );
  const task = useGPTTask();
  const applicationId = useSelector(getCurrentApplicationId);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  /**
   * Store the AI response
   * `null` value represents the state when AI response is either not generated or rejected.
   */
  const [response, setResponse] = React.useState<TAssistantPrompt | null>(null);
  const [query, setQuery] = useState("");
  const queryContainerRef = useTextAutocomplete(query, setQuery);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);

  /**
   * Called when AI response is received
   * Stores the response and calls the update method
   * @param value
   */
  const updateResponse = (response: TAssistantPrompt) => {
    setResponse(response);
    const editorCode = response.content.editorCode.trim();

    // Update the editor state only for JS Expressions
    if (task.id === GPTTask.JS_EXPRESSION && editorCode) {
      props.update?.(editorCode);
    }
  };

  const prevOpen = usePrevious(props.isOpen);

  /**
   * Holds the default value of the property
   */
  const defaultValue = React.useRef<string>(currentValue);

  useEffect(() => {
    // Popover close -> open
    if (prevOpen !== props.isOpen && props.isOpen) {
      defaultValue.current = currentValue;
      setQuery("");
      setResponse(null);
    }
  }, [props.isOpen, currentValue, prevOpen]);

  const [promptTriggerSource, setPromptTriggerSource] = useState(
    PromptTriggers.USER,
  );
  /**
   * When this is invoked the field should already be updated.
   * Logs analytics and closes the popover.
   * @param query
   * @param task
   */
  const acceptResponse = useCallback(
    (implicit = false) => {
      if (response) {
        AnalyticsUtil.logEvent("AI_RESPONSE_FEEDBACK", {
          responseId: response.messageId,
          requestedOutputType: task.id,
          liked: true,
          generatedCode: response.content,
          userQuery: query,
          implicit,
          property: props.entity.propertyPath,
          widgetName: props.entity.entityName,
          widgetType: props.entity.widgetType,
          isSuggestedPrompt: promptTriggerSource === PromptTriggers.SUGGESTED,
          isRecentPrompt: promptTriggerSource === PromptTriggers.RECENT,
          entityId: props.entity.entityId,
          entityName: props.entity.entityName,
        });

        // Update the editor state to reflect the accepted response
        props.update?.(response.content.editorCode);
      }
      defaultValue.current = currentValue;
      setResponse(null);
      close();
    },
    [currentValue, close, response, query, task, dataTreePath, setResponse],
  );

  const fetchRecentQueries = useCallback(async () => {
    if (!applicationId || !task) return;

    const result = await getApplicationAIRecentQueriesByType(
      applicationId,
      task.id,
    );

    setRecentQueries(result);
  }, [applicationId, task]);

  useEffect(() => {
    fetchRecentQueries();
  }, [fetchRecentQueries]);

  useEffect(() => {
    acceptResponseRef.current = acceptResponse;
  }, [acceptResponse]);

  const dataTree = useSelector(getDataTree);
  const configTree = useSelector(getConfigTree);
  const [suggestedBindings, setSuggestedBindings] = useState<string[]>([]);

  useEffect(() => {
    //Get and set all the suggested bindings
    const platformFunctions = getPlatformFunctions(self.$cloudHosting);

    const bestBindings = getAllPossibleBindingsForSuggestions(
      props.entity,
      props.entitiesForNavigation,
      platformFunctions,
      dataTree,
      configTree,
      props.dataTreePath,
    );

    setSuggestedBindings(bestBindings.map((b: Record<string, any>) => b.text));
  }, []);

  const [
    noOfTimesSuggestedPromptsShownForType,
    setNoOfTimesSuggestedPromptsShownForTypeInState,
  ] = useState<number | null>(null);

  const fetchApplicationAIRecentQueriesByType = useCallback(async () => {
    if (!applicationId || !task) return;

    const result = await getAISuggestedPromptShownForType(
      props.entity.expectedType || "unknown",
    );

    setNoOfTimesSuggestedPromptsShownForTypeInState(result);
  }, [applicationId, task]);

  useEffect(() => {
    fetchApplicationAIRecentQueriesByType();
    const expectedType = props.entity.expectedType;

    setAISuggestedPromptShownForType(expectedType || "unknown");
  }, []);

  useEffect(() => {
    return () => {
      acceptResponseRef.current?.(true);
    };
  }, []);

  const location = useLocation();
  const { pageType } = getEntityInCurrentPath(location.pathname);
  const showSuggestedPrompts = useMemo(() => {
    return (
      noOfTimesSuggestedPromptsShownForType !== null &&
      noOfTimesSuggestedPromptsShownForType < 5 &&
      !response &&
      !isLoading &&
      suggestedBindings.length > 0 &&
      pageType !== "queryEditor"
    );
  }, [
    noOfTimesSuggestedPromptsShownForType,
    response,
    isLoading,
    suggestedBindings,
  ]);

  const showRecentQueries = useMemo(() => {
    return (
      !response &&
      !isLoading &&
      recentQueries.length > 0 &&
      !showSuggestedPrompts
    );
  }, [response, isLoading, recentQueries, showSuggestedPrompts]);

  /** To hold the latest reference of props.acceptResponse,
   * It needs to be fired when the component unmounts */
  const acceptResponseRef = useRef(acceptResponse);

  /**
   * Sets the AI response to null and restore the property to its default value.
   * @param query
   * @param task
   */
  const rejectResponse = () => {
    // If response is empty, all changes are committed.
    if (!response) return;
    if (!query) return;
    AnalyticsUtil.logEvent("AI_RESPONSE_FEEDBACK", {
      responseId: response.messageId,
      requestedOutputType: task.id,
      liked: false,
      generatedCode: response.content,
      userQuery: query,
      property: props.entity.propertyPath,
      widgetName: props.entity.entityName,
      widgetType: props.entity.widgetType,
      isSuggestedPrompt: promptTriggerSource === PromptTriggers.SUGGESTED,
      isRecentPrompt: promptTriggerSource === PromptTriggers.RECENT,
      entityId: props.entity.entityId,
      entityName: props.entity.entityName,
    });
    setResponse(null);
    props.update?.(defaultValue.current || "");
  };

  const fireQuery = useCallback(
    async (inputQuery: string, trigger = PromptTriggers.USER) => {
      if (isLoading || !inputQuery) return;

      const isSuggestedPrompt = trigger === PromptTriggers.SUGGESTED;
      const isRecentPrompt = trigger === PromptTriggers.RECENT;

      setPromptTriggerSource(trigger);
      setResponse(null);
      setError("");
      setIsLoading(true);

      const taskId = task.id;
      const message: TChatGPTPrompt = {
        role: "user",
        content: inputQuery.slice(0, CHARACTER_LIMIT),
        taskId,
      };
      const [context, additionalQuery, wrapWithBinding] =
        contextGenerator(message);
      const formattedQuery = message.content;
      const enhancedQuery = `${formattedQuery}. ${additionalQuery}`;

      AnalyticsUtil.logEvent("AI_QUERY_SENT", {
        requestedOutputType: taskId,
        characterCount: formattedQuery.length,
        userQuery: formattedQuery,
        enhancedQuery,
        context,
        property: props.entity.propertyPath,
        widgetName: props.entity.entityName,
        widgetType: props.entity.widgetType,
        isSuggestedPrompt,
        isRecentPrompt,
        entityId: props.entity.entityId,
        entityName: props.entity.entityName,
      });

      const start = performance.now();

      try {
        const result = await chatGenerationApi({
          query: enhancedQuery,
          context,
          taskId,
        });

        const {
          data: {
            data: { messageId, response },
            errorDisplay,
            responseMeta: { success },
          },
        } = result;

        if (!success) {
          throw new Error(errorDisplay || "Something went wrong");
        }
        // If the response starts with Error: then we throw an error
        // This is a temp hack to get around the fact that the API doesn't return
        // a 500 when there is an error.
        if (response.includes("Error:")) {
          throw new Error(response);
        }

        const { editorCode, previewCode } = getFormattedCode(
          response,
          taskId,
          wrapWithBinding,
        );

        const message: TChatGPTPrompt = {
          role: "assistant",
          content: {
            editorCode,
            previewCode,
          },
          messageId,
          taskId,
          query: formattedQuery,
        };

        AnalyticsUtil.logEvent("AI_RESPONSE_GENERATED", {
          success: true,
          requestedOutputType: taskId,
          responseId: message.messageId,
          generatedCode: previewCode,
          userQuery: formattedQuery,
          context,
          timeTaken: performance.now() - start,
          property: props.entity.propertyPath,
          widgetName: props.entity.entityName,
          widgetType: props.entity.widgetType,
          isSuggestedPrompt,
          isRecentPrompt,
          entityId: props.entity.entityId,
          entityName: props.entity.entityName,
        });
        updateResponse(message);

        // Add the query to recent queries
        await setAIRecentQuery(applicationId, formattedQuery, task.id);
        await fetchRecentQueries();
      } catch (e: any) {
        const errorMessage = getErrorMessage(e);
        setError(errorMessage);
        AnalyticsUtil.logEvent("AI_RESPONSE_GENERATED", {
          success: false,
          requestedOutputType: taskId,
          timeTaken: performance.now() - start,
          userQuery: formattedQuery,
          context,
          property: props.entity.propertyPath,
          widgetName: props.entity.entityName,
          widgetType: props.entity.widgetType,
          error: e,
          isSuggestedPrompt,
          isRecentPrompt,
          entityId: props.entity.entityId,
          entityName: props.entity.entityName,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, contextGenerator, task, props.entity, applicationId],
  );

  const sendQuery = useCallback(() => {
    if (!query) return;
    fireQuery(query);
  }, [query, fireQuery]);

  useEffect(() => {
    resizeTextArea(queryContainerRef);
  }, [query]);

  useEffect(() => {
    queryContainerRef.current?.focus();
  }, [isLoading]);

  const handleEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.shiftKey || e.ctrlKey || e.metaKey) return;
    if (e.key == "Enter") {
      e.preventDefault();
      sendQuery();
    }
  };

  const onClickHelp = () => {
    window.open(APPSMITH_AI_LINK, "_blank", "noopener noreferrer");
  };

  /**
   * We want to fire this event only after we get all the information for both suggested prompts and recent queries
   * from indexDB before finally deciding on which prompts were actually shown.
   */
  const [hasShownEventBeenFired, setHasShownEventBeenFired] = useState(false);
  useEffect(() => {
    if (
      hasShownEventBeenFired ||
      (!showSuggestedPrompts && !showRecentQueries) ||
      noOfTimesSuggestedPromptsShownForType === null
    )
      return;

    AnalyticsUtil.logEvent("AI_PROMPT_SHOWN", {
      isSuggestedPrompt: showSuggestedPrompts,
      isRecentPrompt: showRecentQueries,
      propertyName: props.entity.propertyPath,
      widgetName: props.entity.entityName,
      totalPrompts: showSuggestedPrompts
        ? suggestedBindings.length
        : recentQueries.length,
      entityId: props.entity.entityId,
      entityName: props.entity.entityName,
    });

    setHasShownEventBeenFired(true);
  }, [
    showSuggestedPrompts,
    showRecentQueries,
    noOfTimesSuggestedPromptsShownForType,
  ]);

  const onClickRecentQuery = (
    query: string,
    index: number,
    trigger: PromptTriggers,
  ) => {
    AnalyticsUtil.logEvent("AI_PROMPT_CLICKED", {
      isSuggestedPrompt: trigger === PromptTriggers.SUGGESTED,
      isRecentPrompt: trigger === PromptTriggers.RECENT,
      propertyName: props.entity.propertyPath,
      widgetName: props.entity.entityName,
      totalPrompts:
        trigger === PromptTriggers.SUGGESTED
          ? suggestedBindings.length
          : recentQueries.length,
      selectedPromptIndex: index,
      userQuery: query,
      entityId: props.entity.entityId,
      entityName: props.entity.entityName,
    });

    setQuery(query);
    queryContainerRef.current?.focus();
    fireQuery(query, trigger);
  };

  if (!task) return null;

  return (
    <div
      className="flex flex-col justify-between h-full w-full overflow-hidden"
      ref={ref}
    >
      <div className="flex flex-col flex-shrink-0 p-4">
        <div className="flex flex-row justify-between pb-4">
          <div className="flex items-center gap-1">
            <Text color="var(--ads-v2-color-fg-emphasis)" kind="heading-s">
              {task.desc}
            </Text>
            <Button
              isIconButton
              kind="tertiary"
              name="help"
              onClick={onClickHelp}
              size="sm"
              startIcon="question-line"
            />
            <BetaCard />
          </div>
          <Button
            isIconButton
            kind="tertiary"
            onClick={close}
            size="md"
            startIcon="close-line"
          />
        </div>
        <QueryForm
          className={"flex w-full relative items-start gap-2 justify-between"}
        >
          <div
            className={classNames(
              "bg-white relative flex items-center w-full overflow-hidden py-[3px] px-2 pr-0",
              {
                disabled: isLoading,
              },
            )}
          >
            <div className="relative flex h-auto items-center w-full">
              <textarea
                className="min-h-[28px] w-full max-h-40 z-2 overflow-auto"
                disabled={isLoading}
                name="text"
                onChange={(e) => {
                  setQuery(e.target.value);
                }}
                onKeyDown={handleEnter}
                placeholder={task.inputPlaceholder}
                ref={queryContainerRef}
                rows={1}
                style={{ resize: "none" }}
                value={query}
              />
            </div>
          </div>
          <Button
            className="!z-2 flex-shrink-0"
            color="red"
            isIconButton
            isLoading={isLoading}
            kind="secondary"
            onClick={sendQuery}
            size="md"
            startIcon="enter-line"
          />
        </QueryForm>
        {isLoading && (
          <Text
            className="!text-[color:var(--ads-v2\-color-fg-muted)] pt-1"
            kind="action-s"
          >
            Generating the code for you...
          </Text>
        )}
        {/* Show the error prompt if there is an error */}
        {error && (
          <div className="pt-3">
            <Callout kind="error">{error}</Callout>
          </div>
        )}
        {showRecentQueries && (
          <div className="flex flex-col pt-3">
            <Text
              className="!mb-1"
              color="var(--ads-v2-color-gray-600)"
              kind="heading-xs"
            >
              Recent prompts
            </Text>
            {recentQueries.map((query, index) => (
              <div
                className="flex justify-between items-center py-1 cursor-pointer"
                key={index}
                onClick={() =>
                  onClickRecentQuery(query, index, PromptTriggers.RECENT)
                }
              >
                <Text className="text-ellipsis" kind="body-m">
                  {query}
                </Text>
              </div>
            ))}
          </div>
        )}
        {showSuggestedPrompts && (
          <div className="flex flex-col pt-3">
            <Text className="!mb-1" kind="heading-xs">
              Suggested prompts
            </Text>
            {suggestedBindings.map((query, index) => (
              <div
                className="flex justify-between items-center py-1 cursor-pointer"
                key={index}
                onClick={() =>
                  onClickRecentQuery(query, index, PromptTriggers.SUGGESTED)
                }
              >
                <Text className="text-ellipsis">{query}</Text>
              </div>
            ))}
          </div>
        )}
        {/* Show the response if it is set */}
        {!!response && (
          <div className="flex flex-col pt-3">
            <Text
              className="!mb-1"
              color="var(--ads-v2-color-gray-600)"
              kind="heading-xs"
            >
              Response
            </Text>
            <pre
              className="p-2 whitespace-pre-wrap"
              style={{
                border: "1px solid var(--ads-v2-color-gray-300)",
                color: "var(--ads-v2-color-gray-400)",
                borderRadius: "4px",
              }}
            >
              {response.content.previewCode}
            </pre>
            <div className="flex justify-between items-center pt-2">
              <Button
                kind="secondary"
                onClick={() => rejectResponse()}
                size="md"
                startIcon="thumb-down-line"
              >
                Incorrect response
              </Button>
              <Button kind="primary" onClick={() => acceptResponse()} size="md">
                Use this
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
