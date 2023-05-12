import {
  Button,
  Icon,
  IconSize,
  Spinner,
  importRemixIcon,
} from "design-system-old";
import React, { useCallback, useEffect, useRef } from "react";
import { useState } from "react";
import styled from "styled-components";
import classNames from "classnames";
import BetaCard from "../../../../components/editorComponents/BetaCard";
import type { GPTTask, TChatGPTPrompt } from "./utils";
import { selectIsAIWindowOpen } from "./utils";
import { useTextAutocomplete } from "./utils";
import { selectGPTTask } from "./utils";
import { selectIsAILoading } from "./utils";
import { selectShowExamplePrompt } from "./utils";
import { useChatScroll } from "./utils";
import { selectGPTMessages } from "./utils";
import { useGPTTasks } from "./utils";
import { useGPTContextGenerator } from "./utils";
import { GettingStarted } from "./GetStarted";
import { GPTPrompt } from "./GPTPrompt";
import { useDispatch, useSelector } from "react-redux";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { Colors } from "constants/Colors";

const Send = importRemixIcon(() => import("remixicon-react/SendPlaneFillIcon"));

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
  }
  .autocomplete-overlay {
    color: #afafaf;
    position: absolute;
    z-index: 1;
    top: 4px;
    left: 8px;
    padding-right: 20px;
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
  const messages = useSelector(selectGPTMessages);
  const messageContainerRef = useChatScroll(messages);
  const contextGenerator = useGPTContextGenerator();
  const isLoading = useSelector(selectIsAILoading);
  const showExamplePrompt = useSelector(selectShowExamplePrompt);
  const allTasks = useGPTTasks();
  const task = useSelector(selectGPTTask);
  const isAIWindowOpen = useSelector(selectIsAIWindowOpen);

  const setTask = useCallback((task: GPTTask) => {
    dispatch({
      type: ReduxActionTypes.SET_AI_TASK,
      payload: task,
    });
  }, []);

  const toggleExamplePrompt = (show: boolean) => {
    dispatch({
      type: ReduxActionTypes.SHOW_EXAMPLE_GPT_PROMPT,
      payload: show,
    });
  };

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
    setTask(allTasks[0].id);
  }, [allTasks]);

  useEffect(() => {
    return () => {
      dispatch({
        type: ReduxActionTypes.TOGGLE_AI_WINDOW,
        payload: { show: false },
      });
    };
  }, []);

  useEffect(() => {
    resizeTextArea(queryContainerRef);
  }, [query]);

  useEffect(() => {
    queryContainerRef.current?.focus();
  }, [isLoading, isAIWindowOpen]);

  const sendQuery = useCallback(() => {
    if (isLoading) return;
    if (!query) return;
    toggleExamplePrompt(false);
    const message: TChatGPTPrompt = {
      role: "user",
      content: query.slice(0, CHARACTER_LIMIT),
      task: task,
    };
    addMessage(message);
    const context = contextGenerator(message);
    setQuery("");
    dispatch({
      type: ReduxActionTypes.ASK_AI,
      payload: {
        query: message.content,
        context,
        task,
      },
    });
  }, [isLoading, query, contextGenerator, task]);

  const queryContainerRef = useTextAutocomplete(query, setQuery);

  const handleEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.shiftKey || e.ctrlKey || e.metaKey) return;
    if (e.key == "Enter") {
      e.preventDefault();
      sendQuery();
    }
  };

  const dispatch = useDispatch();

  const closeWindow = () => {
    dispatch({
      type: ReduxActionTypes.TOGGLE_AI_WINDOW,
      payload: { show: false },
    });
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
        className="flex flex-col justify-start gap-2 px-4 pb-3 overflow-auto scroll-smooth"
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
        {showExamplePrompt && <GettingStarted task={task} />}
      </div>
      <div
        className={classNames({
          "flex justify-end flex-shrink-0": true,
          hidden: !messages.length,
          "px-4 font-normal": true,
        })}
      >
        <div
          className="h-6 text-xs flex items-center hover:underline cursor-pointer"
          onClick={() => toggleExamplePrompt(!showExamplePrompt)}
        >
          {showExamplePrompt ? "Hide" : "Show"} example prompts
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
                disabled={isLoading}
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
              "border border-gray-300 py-[4px]  rounded-md": true,
              disabled: isLoading, //|| parseInt(queryCount) < 1,
            })}
          >
            <div className="relative pl-1 flex h-auto items-center w-full">
              <textarea
                className="min-h-[30px] w-full max-h-40 z-2 p-1 overflow-auto !pr-5"
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
