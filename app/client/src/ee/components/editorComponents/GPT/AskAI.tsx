import { Button, Icon, IconSize, Spinner, importSvg } from "design-system-old";
import React, { useCallback, useEffect, useRef, useMemo } from "react";
import { useState } from "react";
import styled from "styled-components";
import classNames from "classnames";
import type {
  TAssistantPrompt,
  TChatGPTContext,
  TChatGPTPrompt,
} from "./utils";
import { GPTTask } from "./utils";
import { useTextAutocomplete } from "./utils";
import { useGPTTask } from "./utils";
import { useGPTContextGenerator } from "./utils";
import { Colors } from "constants/Colors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { ErrorPrompt, UserPrompt } from "./GPTPrompt";
import type { CodeEditorExpected } from "components/editorComponents/CodeEditor";
import { examplePrompts } from "./GetStarted";

const EnterIcon = importSvg(() => import("assets/icons/ads/enter.svg"));

const QueryForm = styled.form`
  > div:focus-within {
    border-color: var(--appsmith-color-black-900);
  }
  > div.disabled {
    background-color: ${Colors.GRAY_100};
  }
  textarea {
    color: ${Colors.GREY_10};
    background: transparent;
    z-index: 2;
    font-size: 13px;
  }
  .autocomplete-overlay {
    color: #afafaf;
    position: absolute;
    font-size: 13px;
    z-index: 1;
    top: 4px;
    left: 8px;
    padding-right: 20px;
  }
  svg:hover {
    fill: ${Colors.GRAY_800};
  }
`;

const resizeTextArea = (el: React.RefObject<HTMLTextAreaElement>) => {
  if (!el.current) return;
  el.current.style.height = "";
  el.current.style.height = el.current.scrollHeight + "px";
};

const CHARACTER_LIMIT = 500;

type TAskAIProps = {
  updateResponse: (val: TAssistantPrompt) => void;
  acceptResponse: (query: string) => void;
  rejectResponse: (query: string, implicit?: boolean) => void;
  close: () => void;
  triggerContext?: CodeEditorExpected;
  response: TAssistantPrompt | null;
  dataTreePath?: string;
};

export function AskAI(props: TAskAIProps) {
  const { close, triggerContext, updateResponse } = props;
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const contextGenerator = useGPTContextGenerator(
    props.dataTreePath,
    props.triggerContext,
  );
  const task = useGPTTask();
  const [isLoading, setIsLoading] = useState(false);
  const queryContainerRef = useTextAutocomplete(query, setQuery);
  const [error, setError] = useState<string>("");
  const queryCache = useRef<string>("");

  useEffect(() => {
    return () => {
      props.rejectResponse(queryCache.current, true);
    };
  }, []);

  const sendQuery = useCallback(() => {
    if (isLoading) return;
    if (!query) return;
    const message: TChatGPTPrompt = {
      role: "user",
      content: query.slice(0, CHARACTER_LIMIT),
      task: task.id,
    };
    const [context, additionalQuery] = contextGenerator(message);
    fireQuery(message.content, context, task.id, additionalQuery);
  }, [isLoading, query, contextGenerator, task]);

  useEffect(() => {
    resizeTextArea(queryContainerRef);
    queryCache.current = query;
  }, [query]);

  useEffect(() => {
    queryContainerRef.current?.focus();
  }, [isLoading]);

  const fireQuery = async (
    query: string,
    context: TChatGPTContext,
    task: GPTTask,
    additionalQuery = "",
  ) => {
    setError("");
    setIsLoading(true);
    const enhancedQuery = `${query}. ${additionalQuery}`;
    AnalyticsUtil.logEvent("AI_QUERY_SENT", {
      requestedOutputType: task,
      characterCount: query.length,
      userQuery: query,
      enhancedQuery,
      context,
    });
    const start = performance.now();
    try {
      const res: Response = await fetch(
        `/api/v1/chat/chat-generation?type=${task}`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_query: enhancedQuery,
            ...context,
          }),
        },
      );
      const result: { data: any; responseMeta: any } = await res.json();
      if (!res?.ok) {
        throw new Error(
          result?.responseMeta?.error?.message || "Something went wrong",
        );
      }
      const message: TChatGPTPrompt = {
        role: "assistant",
        content: result.data.response,
        messageId: result.data.messageId,
        task: task,
        query,
      };
      AnalyticsUtil.logEvent("AI_RESPONSE_GENERATED", {
        success: true,
        requestedOutputType: task,
        responseId: message.messageId,
        generatedCode: message.content,
        userQuery: query,
        context,
        timeTaken: performance.now() - start,
      });
      updateResponse(message);
    } catch (e) {
      setError((e as any).message);
      AnalyticsUtil.logEvent("AI_RESPONSE_GENERATED", {
        success: false,
        requestedOutputType: task,
        timeTaken: performance.now() - start,
        userQuery: query,
      });
    }
    setIsLoading(false);
  };

  const handleEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.shiftKey || e.ctrlKey || e.metaKey) return;
    if (e.key == "Enter") {
      e.preventDefault();
      sendQuery();
    }
  };

  const placeholder = useMemo(() => {
    let customPlaceholder = "";
    if (task.id === GPTTask.JS_EXPRESSION) {
      if (triggerContext?.autocompleteDataType) {
        const placeholder =
          examplePrompts[task.id][triggerContext?.autocompleteDataType];
        if (placeholder) {
          customPlaceholder = `Eg. ${placeholder}`;
        }
      }
    }
    return customPlaceholder;
  }, [task.id, triggerContext]);

  return (
    <div
      className="flex flex-col justify-between h-full w-full overflow-hidden"
      ref={ref}
    >
      <div
        className={classNames(
          "flex flex-col flex-shrink-0 p-2 pb-1 gap-1 bg-gray-50",
          !task && "hidden",
        )}
      >
        <div className="flex flex-row justify-between">
          <div className="flex items-center gap-1">
            <p className="text-xs font-medium">{task.desc}</p>
            <div className="px-1 text-[11px] font-semibold text-gray-700 uppercase border border-gray-700">
              beta
            </div>
          </div>
          <Icon
            fillColor={Colors.GRAY}
            name="close-modal"
            onClick={close}
            size={IconSize.XXL}
          />
        </div>
        {error && (
          <ErrorPrompt
            prompt={{ content: error, task: task.id, role: "error" }}
          />
        )}
        <QueryForm
          className={classNames(
            "flex w-full relative items-center justify-between",
            props.response && "hidden",
          )}
        >
          <div
            className={classNames({
              "bg-white relative flex items-center w-full overflow-hidden":
                true,
              "border border-gray-300 py-[4px]": true,
              disabled: isLoading,
            })}
          >
            <div className="relative pl-1 flex h-auto items-center w-full">
              <textarea
                className="min-h-[30px] w-full max-h-40 z-2 p-1 overflow-auto !pr-6"
                disabled={isLoading}
                name="text"
                onChange={(e) => {
                  setQuery(e.target.value);
                }}
                onKeyDown={handleEnter}
                placeholder={`Type your query here. ${placeholder}`}
                ref={queryContainerRef}
                rows={1}
                style={{ resize: "none" }}
                value={query}
              />
            </div>
          </div>
          {isLoading ? (
            <div className="!h-9 absolute right-2 flex items-center">
              <Spinner size={IconSize.LARGE} />
            </div>
          ) : (
            <EnterIcon
              className="!h-9 z-10 absolute right-2 cursor-pointer"
              fill={Colors.GRAY_500}
              height={16}
              onClick={() => {
                sendQuery();
              }}
              width={16}
            />
          )}
        </QueryForm>
        <div
          className={classNames(
            props.response && "hidden",
            "flex items-center justify-end gap-[2px] text-[11px] text-[#777777]",
          )}
        >
          Powered by{" "}
          <a
            className="text-[#F86A2B]"
            href="https://appsmith.notion.site/AI-features-in-Appsmith-fd22891eb9b946e4916995cecf97a9ad"
            rel="noreferrer"
            target="_blank"
          >
            Appsmith AI
          </a>
        </div>
        <div
          className={classNames(
            "flex flex-col gap-2",
            !props.response && "hidden",
          )}
        >
          <UserPrompt
            prompt={{ content: query, task: task.id, role: "user" }}
          />
          <div className="flex flex-row justify-between items-center pb-1">
            <Button
              category="secondary"
              onClick={() => props.acceptResponse(query)}
              text="Accept"
            />
            <Button
              category="secondary"
              onClick={() => props.rejectResponse(query)}
              text="Reject"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
