import { Button, Icon, IconSize, Spinner } from "design-system-old";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useState } from "react";
import styled from "styled-components";
import Send from "remixicon-react/SendPlaneFillIcon";
import { useLocation } from "react-router-dom";
import classNames from "classnames";
import BetaCard from "../../../../components/editorComponents/BetaCard";
import type { TChatGPTContext, TChatGPTPrompt } from "./utils";
import { getGPTTasks, useGPTContextGenerator } from "./utils";
import { GettingStarted } from "./GetStarted";
import { GPTPrompt } from "./GPTPrompt";
import { useDispatch } from "react-redux";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { Colors } from "constants/Colors";
// import { useLocalStorage } from "utils/hooks/localstorage";
import AnalyticsUtil from "utils/AnalyticsUtil";

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
  const [messages, setMessages] = useState<TChatGPTPrompt[]>([]);
  const contextGenerator = useGPTContextGenerator();
  const [isLoading, setLoading] = useState(false);
  const location = useLocation();
  // const [queryCount, setQueryCount] = useLocalStorage("queryCount", "25");

  useEffect(() => {
    return () => {
      dispatch({
        type: ReduxActionTypes.TOGGLE_AI_WINDOW,
        payload: false,
      });
    };
  }, []);

  const tasks = useMemo(() => {
    return getGPTTasks(location.pathname);
  }, [location.pathname]);

  const [task, setTask] = useState(tasks[0]?.id);

  useEffect(() => {
    messageContainerRef.current?.scrollTo(
      0,
      messageContainerRef.current.scrollHeight,
    );
  }, [messages.length]);

  const handleTaskSelection = useCallback((task: any) => {
    setTask(task.id);
  }, []);

  const sendQuery = useCallback(() => {
    if (isLoading) return;
    if (!query) return;
    setLoading(true);
    const message: TChatGPTPrompt = {
      role: "user",
      content: query.slice(0, CHARACTER_LIMIT),
    };
    setMessages((messages: any) => [...messages, message]);
    const context = contextGenerator(message);
    setQuery("");
    fireQuery(message.content, context);
  }, [isLoading, query, contextGenerator]);

  const fireQuery = async (query: string, context: TChatGPTContext) => {
    AnalyticsUtil.logEvent("AI_QUERY_SENT", {
      requestedOutputType: task,
      characterCount: query.length,
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
            api_context: context,
          }),
        },
      );
      const result = await res.json();
      const message: TChatGPTPrompt = {
        role: "assistant",
        content: result.data.response,
        messageId: result.data.messageId,
      };
      if (message) setMessages((messages) => [...messages, message]);
      setLoading(false);
      // setQueryCount(parseInt(queryCount) - 1);
      AnalyticsUtil.logEvent("AI_RESPONSE_GENERATED", {
        success: true,
        requestedOutputType: task,
        responseId: message.messageId,
      });
    } catch (e) {
      setLoading(false);
      AnalyticsUtil.logEvent("AI_RESPONSE_GENERATED", {
        success: false,
        requestedOutputType: task,
      });
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
        className="flex flex-col justify-start gap-2 px-4 pb-2 overflow-auto"
        ref={messageContainerRef}
        style={{ height: "calc(100% - 150px)" }}
      >
        {messages.length ? (
          <div className="flex flex-col gap-2 w-full justify-start">
            {messages.map((r: any, idx: number) => (
              <GPTPrompt key={idx} prompt={r} task={task} />
            ))}
          </div>
        ) : (
          <GettingStarted
            onClick={(query: string) => {
              if (queryContainerRef?.current) {
                queryContainerRef.current.innerText = query;
                setTimeout(() => resizeTextArea(queryContainerRef));
              }
              setQuery(query);
            }}
            task={task}
          />
        )}
      </div>
      <div className="flex flex-col flex-shrink-0 gap-1 px-3 pb-3 pt-3 bg-gray-100">
        <div className="flex flex-row justify-between px-1 items-center">
          <div className="flex flex-row gap-2 justify-start">
            {tasks.map((t) => (
              <Button
                category="secondary"
                className={classNames({
                  "!bg-gray-200": task === t.id,
                })}
                key={t.id}
                onClick={() => handleTaskSelection(t)}
                text={t.text}
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
              "box-border border border-border-gray-300 py-[4px]  rounded-md":
                true,
              disabled: isLoading, //|| parseInt(queryCount) < 1,
            })}
          >
            <textarea
              className="m-[1px] w-full min-h-7 px-2 py-1 !pr-5 max-h-40 overflow-auto"
              disabled={isLoading} // || parseInt(queryCount) < 1}
              name="text"
              onChange={(e) => {
                setQuery(e.target.value);
                resizeTextArea(queryContainerRef);
              }}
              onKeyDown={handleEnter}
              placeholder="Type your query here"
              ref={queryContainerRef}
              rows={1}
              style={{ resize: "none" }}
              value={query}
            />
            {/* <div className="absolute z-1 h-full w-full  rounded-md mask" /> */}
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
        {/* <div className="text-xs font-normal w-full flex justify-end px-1 items-center">
          <span>
            You have <span className="font-semibold">{queryCount}</span>{" "}
            {queryCount === 1 ? "query" : "queries"} left.
          </span>
          <span
            className={classNames({
              "text-xs font-medium": true,
              "text-[#E22C2C]": query.length > CHARACTER_LIMIT,
            })}
          >
            {query.length}/{CHARACTER_LIMIT}
          </span>
        </div> */}
      </div>
    </div>
  );
}
