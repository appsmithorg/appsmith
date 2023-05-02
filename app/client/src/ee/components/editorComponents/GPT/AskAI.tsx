import { Button, Icon, IconSize, Spinner } from "design-system-old";
import React, { useCallback, useEffect, useRef } from "react";
import { useState } from "react";
import styled from "styled-components";
import Send from "remixicon-react/SendPlaneFillIcon";
import classNames from "classnames";
import BetaCard from "../../../../components/editorComponents/BetaCard";
import type { GPTTask, TChatGPTContext, TChatGPTPrompt } from "./utils";
import { selectGPTMessages } from "./utils";
import { useGPTTasks } from "./utils";
import { useGPTContextGenerator } from "./utils";
import { GettingStarted } from "./GetStarted";
import { GPTPrompt } from "./GPTPrompt";
import { useDispatch, useSelector } from "react-redux";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { Colors } from "constants/Colors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import ArrowLeft from "remixicon-react/ArrowLeftSLineIcon";

const QueryForm = styled.form`
  > div:focus-within {
    border-color: var(--appsmith-color-black-900);
  }
  > div.disabled {
    background-color: ${Colors.GRAY_100};
  }
  textarea {
    color: ${Colors.GREY_10};
  }
`;

const resizeTextArea = (el: React.RefObject<HTMLTextAreaElement>) => {
  if (!el.current) return;
  el.current.style.height = "";
  el.current.style.height = el.current.scrollHeight + "px";
};

const CHARACTER_LIMIT = 500;

export function AskAI() {
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const messageContainerRef = React.useRef<HTMLDivElement>(null);
  const messages = useSelector(selectGPTMessages);
  const contextGenerator = useGPTContextGenerator();
  const [isLoading, setLoading] = useState(false);
  const [showExamplePrompt, setShowExamplePrompt] = useState(false);
  const allTasks = useGPTTasks();
  const [task, setTask] = useState<GPTTask>(() => {
    const enabled = allTasks.filter((t) => !t.disabled) as typeof allTasks;
    return enabled[0].id;
  });

  const addMessage = useCallback(
    (prompt: TChatGPTPrompt) => {
      dispatch({
        type: ReduxActionTypes.ADD_GPT_MESSAGE,
        payload: prompt,
      });
    },
    [task],
  );

  useEffect(() => {
    const enabled = allTasks.filter((t) => !t.disabled) as typeof allTasks;
    setTask(enabled[0].id);
  }, [allTasks]);

  useEffect(() => {
    setShowExamplePrompt(messages.length === 0);
    setTimeout(() => {
      messageContainerRef.current?.scrollTo({
        top: messageContainerRef.current.scrollHeight,
        left: 0,
      });
    });
  }, [messages.length]);

  useEffect(() => {
    return () => {
      dispatch({
        type: ReduxActionTypes.TOGGLE_AI_WINDOW,
        payload: false,
      });
    };
  }, []);

  useEffect(() => {
    resizeTextArea(queryContainerRef);
  }, [query]);

  useEffect(() => {
    setShowExamplePrompt(Boolean(task));
  }, [task]);

  const sendQuery = useCallback(() => {
    if (isLoading) return;
    if (!query) return;
    setLoading(true);
    const message: TChatGPTPrompt = {
      role: "user",
      content: query.slice(0, CHARACTER_LIMIT),
      task: task,
    };
    addMessage(message);
    const context = contextGenerator(message);
    setQuery("");
    fireQuery(message.content, context);
  }, [isLoading, query, contextGenerator, task]);

  const fireQuery = async (query: string, context: TChatGPTContext) => {
    AnalyticsUtil.logEvent("AI_QUERY_SENT", {
      requestedOutputType: task,
      characterCount: query.length,
      userQuery: query,
      context,
    });
    try {
      const res: any = await fetch(
        `/api/v1/chat/chat-generation?type=${task}`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_query: query,
            ...context,
          }),
        },
      );
      const result = await res.json();
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
      };
      addMessage(message);
      setLoading(false);
      AnalyticsUtil.logEvent("AI_RESPONSE_GENERATED", {
        success: true,
        requestedOutputType: task,
        responseId: message.messageId,
        generatedCode: message.content,
        userQuery: query,
        context,
      });
    } catch (e) {
      setLoading(false);
      AnalyticsUtil.logEvent("AI_RESPONSE_GENERATED", {
        success: false,
        requestedOutputType: task,
      });
      addMessage({ role: "error", content: (e as any).message, task });
    }
  };

  const queryContainerRef = useRef<HTMLTextAreaElement>(null);

  const handleEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key == "Enter" && e.shiftKey == false) {
      e.preventDefault();
      sendQuery();
    }
  };

  const dispatch = useDispatch();

  const closeWindow = () => {
    dispatch({ type: ReduxActionTypes.TOGGLE_AI_WINDOW, payload: false });
  };

  const handleTaskSelection = useCallback((task: any) => {
    setTask(task.id);
  }, []);

  return (
    <div
      className="flex flex-col justify-between h-full w-full overflow-hidden"
      ref={ref}
    >
      <div className="flex font-semibold flex-shrink-0 px-4 pt-4 pb-2 flex-row justify-between items-center">
        <div className="text-lg items-center gap-2 flex font-semibold flex-row justify-start">
          Ask AI <BetaCard />
        </div>
        <Icon
          fillColor={Colors.GRAY}
          name="close-modal"
          onClick={closeWindow}
          size={IconSize.XXL}
        />
      </div>
      <div
        className="flex flex-col justify-start gap-2 px-4 pb-3 overflow-auto"
        ref={messageContainerRef}
        style={{ height: "calc(100% - 150px)" }}
      >
        <div
          className={classNames({
            "flex flex-col justify-between h-full": true,
            hidden: showExamplePrompt,
          })}
        >
          <div className="flex flex-col gap-2 w-full justify-start">
            {messages.map((r: any, idx: number) => (
              <GPTPrompt key={idx} prompt={r} />
            ))}
          </div>
        </div>
        {showExamplePrompt && (
          <GettingStarted
            onClick={(query: string) => {
              if (queryContainerRef?.current) {
                queryContainerRef.current.innerText = query;
              }
              setQuery(query);
            }}
            task={task}
          />
        )}
      </div>
      <div
        className={classNames({
          "flex justify-end flex-shrink-0": true,
          hidden: !task || showExamplePrompt,
        })}
      >
        <div
          className="h-6 items-center px-4 gap-[2px] text-[11px] flex flex-row font-normal hover:underline cursor-pointer"
          onClick={() => setShowExamplePrompt(true)}
        >
          <ArrowLeft size={13} />
          Show example prompts
        </div>
      </div>
      <div
        className={classNames({
          "flex flex-col flex-shrink-0 px-3 pb-3 pt-2 gap-[2px] bg-gray-100":
            true,
          hidden: !task,
        })}
      >
        <div className="flex flex-row justify-between px-1 items-center">
          <div className="flex flex-row gap-2 justify-start">
            {allTasks.map((t) => (
              <Button
                category="secondary"
                className={classNames({
                  "!bg-gray-200": task === t.id,
                })}
                disabled={t.disabled || isLoading}
                key={t.id}
                onClick={() => handleTaskSelection(t)}
                text={t.title}
              />
            ))}
          </div>
          <span
            className={classNames({
              "text-xs font-medium": true,
              "text-[#E22C2C]": query.length > CHARACTER_LIMIT,
            })}
          >
            {query.length}/{CHARACTER_LIMIT}
          </span>
        </div>
        <QueryForm className="flex w-full relative mt-1 items-center justify-between">
          <div
            className={classNames({
              "bg-white relative flex items-center w-full overflow-hidden":
                true,
              "box-border border border-gray-300 py-[4px]  rounded-md": true,
              disabled: isLoading, //|| parseInt(queryCount) < 1,
            })}
          >
            <textarea
              className="m-[1px] min-h-[29px] w-full px-2 py-1 !pr-5 max-h-40 overflow-auto"
              disabled={isLoading} // || parseInt(queryCount) < 1}
              name="text"
              onChange={(e) => {
                setQuery(e.target.value);
              }}
              onKeyDown={handleEnter}
              placeholder="Type your query here"
              ref={queryContainerRef}
              rows={1}
              style={{ resize: "none" }}
              value={query}
            />
          </div>
          {isLoading ? (
            <div className="!h-9 absolute right-2 flex items-center">
              <Spinner size={IconSize.LARGE} />
            </div>
          ) : (
            <Send
              className="!h-9 absolute right-2 hover:fill-slate-800 cursor-pointer"
              color="lightgray"
              onClick={() => {
                sendQuery();
              }}
              size={16}
            />
          )}
        </QueryForm>
      </div>
    </div>
  );
}

/** Might need this soon
 {!task && (
  <div className="flex flex-col py-2 gap-1 px-4">
    <p className="text-[13px] font-semibold pb-2">
      Quickly generate JS code snippets and SQL queries by typing a
      prompt.
    </p>
    <div className="text-xs font-medium">Select a task</div>
    <div className="flex flex-col gap-2">
      {allTasks.map(({ disabled, id, text }) => (
        <Button
          category="tertiary"
          className={classNames({
            "flex !justify-between items-center !h-auto !p-2": true,
            "!text-[12px] !text-black !font-normal !text-left !normal-case !leading-4":
              true,
            "bg-white border !border-[#f0f0f0]": true,
            "!bg-gray-100 !text-gray-500 !cursor-not-allowed": disabled,
          })}
          disabled={disabled}
          icon="right-arrow"
          key={id}
          onClick={() => setTask(id)}
          text={text}
        />
      ))}
    </div>
  </div>
)} 
 */
