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
import { Button, Callout, Link, Spinner, Text } from "design-system";
import { usePrevious } from "@mantine/hooks";
import { APPSMITH_AI_LINK } from "./constants";
import type { TAIWrapperProps } from "@appsmith/components/editorComponents/GPT";
import { useDispatch, useSelector } from "react-redux";
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
import { getJSCollectionFromName } from "@appsmith/selectors/entitiesSelector";
import { autoIndentCode } from "components/editorComponents/CodeEditor/utils/autoIndentUtils";
import { updateJSCollectionBody } from "actions/jsPaneActions";
import {
  AI_INCORRECT_FEEDBACK_BUTTON_LABEL,
  AI_POPOVER_TITLE,
  AI_PROMPT_EXAMPLE_PREFIX,
  AI_PROMPT_HELP_TEXT,
  AI_RECENT_PROMPTS,
  AI_RESPONSE_LOADING,
  AI_USE_THIS_BUTTON_LABEL,
} from "@appsmith/constants/messages";

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
    padding: 9px 0;
    font-size: 14px;
    padding-right: 8px;
    line-height: 16px;
    z-index: 1;
    top: 0;
  }
`;

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 10;
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: var(--ads-color-black-0);
  box-shadow: var(--ads-v2-shadow-popovers);
  padding: 4px;
`;

const DropdownItem = styled.div`
  padding: 8px;
  cursor: pointer;
  &:hover {
    background-color: var(--ads-v2-colors-content-surface-hover-bg);
  }
`;

const DropdownHeader = styled.div`
  padding: 8px;
`;

const resizeTextArea = (el: React.RefObject<HTMLTextAreaElement>) => {
  if (!el.current) return;
  el.current.style.height = "";
  el.current.style.height = el.current.scrollHeight + "px";
};

const CHARACTER_LIMIT = 500;

type TAskAIProps = Omit<
  TAIWrapperProps,
  "enableAIAssistance" | "children" | "onOpenChanged"
> & {
  isOpen: boolean;
  close: () => void;
};

export function AskAI(props: TAskAIProps) {
  const dispatch = useDispatch();
  const { close, currentValue, dataTreePath } = props;
  const ref = useRef<HTMLDivElement>(null);
  const contextGenerator = useGPTContextGenerator(
    props.currentValue,
    props.entity,
    props.dataTreePath,
    props.triggerContext,
  );
  const task = useGPTTask();
  const applicationId = useSelector(getCurrentApplicationId);
  const configTree = useSelector(getConfigTree);
  const [suggestedBinding, setSuggestedBinding] = useState<string>("");
  const dataTree = useSelector(getDataTree);
  const aiContext = useSelector((state) => state.ai.context);
  const jsCollection = useSelector((state) =>
    getJSCollectionFromName(state, props.entity.entityName || ""),
  );

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

  const updateJSAction = useCallback(
    (generatedCode: string) => {
      const currentBody = jsCollection?.config.body;
      const lines = currentBody?.split("\n") || [];
      const insertIndex = aiContext.cursorPosition?.line || 0;
      const generatedCodeLines = generatedCode.split("\n");
      const updatedLines = [
        ...lines.slice(0, insertIndex),
        ...generatedCodeLines,
        ...lines.slice(insertIndex + 1),
      ];

      if (jsCollection?.config.id) {
        props.update?.(updatedLines.join("\n"));
        autoIndentCode(props.editor);
        dispatch(
          updateJSCollectionBody(
            props.editor.getValue(),
            jsCollection.config.id,
          ),
        );
      }
    },
    [jsCollection, aiContext.cursorPosition, dispatch],
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

        if (task.id !== GPTTask.JS_FUNCTION) {
          props.update?.(response.content.editorCode);
        } else {
          updateJSAction(response.content.editorCode);
        }
      }
      defaultValue.current = currentValue;
      setResponse(null);
      close();
    },
    [
      currentValue,
      close,
      response,
      query,
      task,
      dataTreePath,
      setResponse,
      updateJSAction,
    ],
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

  useEffect(() => {
    //Get and set all the suggested bindings
    const platformFunctions = getPlatformFunctions();

    const bestBindings = getAllPossibleBindingsForSuggestions(
      props.entity,
      props.entitiesForNavigation,
      platformFunctions,
      dataTree,
      configTree,
      props.dataTreePath,
    );

    if (bestBindings.length) {
      const suggestedBindingForEntity = bestBindings[0].text;
      setSuggestedBinding(suggestedBindingForEntity);
    }
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
      if (task.id === GPTTask.JS_FUNCTION) {
        return;
      }

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
      suggestedBinding &&
      pageType !== "queryEditor" &&
      pageType !== "jsEditor"
    );
  }, [
    noOfTimesSuggestedPromptsShownForType,
    response,
    isLoading,
    suggestedBinding,
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
    if (task.id !== GPTTask.JS_FUNCTION) {
      props.update?.(defaultValue.current || "");
    }
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
      const userPropmpt: TChatGPTPrompt = {
        role: "user",
        content: inputQuery.slice(0, CHARACTER_LIMIT),
        taskId,
      };
      const [context, enhancedQuery] = contextGenerator(userPropmpt);

      AnalyticsUtil.logEvent("AI_QUERY_SENT", {
        requestedOutputType: taskId,
        characterCount: enhancedQuery.length,
        userQuery: enhancedQuery,
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

        const { editorCode, previewCode } = getFormattedCode(response, taskId);

        const assistantResponse: TChatGPTPrompt = {
          role: "assistant",
          content: {
            editorCode,
            previewCode,
          },
          messageId,
          taskId,
          query: userPropmpt.content,
        };

        AnalyticsUtil.logEvent("AI_RESPONSE_GENERATED", {
          success: true,
          requestedOutputType: taskId,
          responseId: assistantResponse.messageId,
          generatedCode: previewCode,
          userQuery: userPropmpt.content,
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
        updateResponse(assistantResponse);

        // Add the query to recent queries
        await setAIRecentQuery(applicationId, userPropmpt.content, task.id);
        await fetchRecentQueries();
      } catch (e: any) {
        const errorMessage = getErrorMessage(e);
        const error = e?.response?.data || e;
        setError(errorMessage);
        AnalyticsUtil.logEvent("AI_RESPONSE_GENERATED", {
          success: false,
          requestedOutputType: taskId,
          timeTaken: performance.now() - start,
          userQuery: userPropmpt.content,
          context,
          property: props.entity.propertyPath,
          widgetName: props.entity.entityName,
          widgetType: props.entity.widgetType,
          error,
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
      totalPrompts: showSuggestedPrompts ? 1 : recentQueries.length,
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
    trigger: PromptTriggers,
    index = 0,
  ) => {
    AnalyticsUtil.logEvent("AI_PROMPT_CLICKED", {
      isSuggestedPrompt: trigger === PromptTriggers.SUGGESTED,
      isRecentPrompt: trigger === PromptTriggers.RECENT,
      propertyName: props.entity.propertyPath,
      widgetName: props.entity.entityName,
      totalPrompts:
        trigger === PromptTriggers.SUGGESTED ? 1 : recentQueries.length,
      selectedPromptIndex: index,
      userQuery: query,
      entityId: props.entity.entityId,
      entityName: props.entity.entityName,
    });

    setQuery(query);
    queryContainerRef.current?.focus();
  };

  if (!task) return null;

  return (
    <div className="flex flex-col justify-between w-full h-full" ref={ref}>
      <div className="flex flex-col flex-shrink-0 p-4">
        <div className="flex flex-row justify-between pb-2">
          <div className="flex items-center gap-1">
            <Text color="var(--ads-v2-color-fg-emphasis)" kind="heading-xs">
              {AI_POPOVER_TITLE()}
            </Text>
            <BetaCard />
          </div>
          <div className="flex items-center gap-1">
            <Button
              isIconButton
              kind="tertiary"
              name="help"
              onClick={onClickHelp}
              size="sm"
              startIcon="question-line"
            />
            <Button
              isIconButton
              kind="tertiary"
              onClick={close}
              size="sm"
              startIcon="close-line"
            />
          </div>
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
          {!query && showRecentQueries && (
            <Dropdown>
              <DropdownHeader>
                <Text kind="body-m">{AI_RECENT_PROMPTS()}</Text>
              </DropdownHeader>
              {recentQueries.map((query, index) => (
                <DropdownItem
                  key={query}
                  onClick={() =>
                    onClickRecentQuery(query, PromptTriggers.RECENT, index)
                  }
                >
                  <Text kind="body-s">{query}</Text>
                </DropdownItem>
              ))}
            </Dropdown>
          )}
        </QueryForm>
        {isLoading && (
          <div
            className="flex items-center p-2 gap-2 mt-1"
            style={{
              backgroundColor: "#f1f5f9",
            }}
          >
            <Spinner size="sm" />
            <Text
              className="!text-[color:var(--ads-v2\-color-fg-muted)]"
              kind="action-s"
            >
              {AI_RESPONSE_LOADING()}
            </Text>
          </div>
        )}
        {/* Show the error prompt if there is an error */}
        {error && (
          <div className="pt-3">
            <Callout kind="error">{error}</Callout>
          </div>
        )}

        {showSuggestedPrompts && (
          <SuggestedPrompt
            onClickRecentQuery={() =>
              onClickRecentQuery(suggestedBinding, PromptTriggers.SUGGESTED)
            }
            query={query}
            suggestedBinding={suggestedBinding}
          />
        )}
        {/* Show the response if it is set */}
        {!!response && (
          <ResponsePreview
            acceptResponse={acceptResponse}
            previewCode={response.content.previewCode}
            rejectResponse={rejectResponse}
          />
        )}
      </div>
    </div>
  );
}

const SuggestedPrompt = ({
  onClickRecentQuery,
  query,
  suggestedBinding,
}: {
  query: string;
  onClickRecentQuery: () => void;
  suggestedBinding: string;
}) => {
  return (
    <div className="pt-1">
      <Text className="leading-tight inline" kind="body-s">
        {query ? AI_PROMPT_HELP_TEXT() : AI_PROMPT_EXAMPLE_PREFIX()}
      </Text>
      {!query && (
        <Link className="!inline" onClick={onClickRecentQuery}>
          <Text
            className="leading-tight"
            kind="body-s"
            style={{
              fontWeight: "var(--ads-font-weight-bold)",
            }}
          >
            {suggestedBinding}
          </Text>
        </Link>
      )}
    </div>
  );
};

const ResponsePreview = ({
  acceptResponse,
  previewCode,
  rejectResponse,
}: {
  previewCode: string;
  rejectResponse: () => void;
  acceptResponse: () => void;
}) => {
  return (
    <div className="flex flex-col pt-1">
      <pre
        className="p-2 whitespace-pre-wrap max-h-[300px] overflow-auto"
        style={{
          border: "1px solid var(--ads-v2-color-gray-300)",
          color: "var(--ads-old-color-outer-space)",
          borderRadius: "4px",
          backgroundColor: "var(--ads-color-black-5)",
        }}
      >
        {previewCode}
      </pre>
      <div className="flex justify-end pt-2 gap-2">
        <Button
          kind="tertiary"
          onClick={rejectResponse}
          size="md"
          startIcon="thumb-down-line"
        >
          {AI_INCORRECT_FEEDBACK_BUTTON_LABEL()}
        </Button>
        <Button kind="primary" onClick={acceptResponse} size="md">
          {AI_USE_THIS_BUTTON_LABEL()}
        </Button>
      </div>
    </div>
  );
};
