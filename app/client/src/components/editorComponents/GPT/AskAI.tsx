/* eslint-disable */
import { Button, IconSize, Spinner } from "design-system-old";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useState } from "react";
import styled from "styled-components";
import { TextArea } from "@blueprintjs/core";
import _ from "lodash";
import Send from "remixicon-react/SendPlaneFillIcon";
import { useLocation } from "react-router-dom";
import classNames from "classnames";
import BetaCard from "../BetaCard";
import {
  TChatGPTContext,
  TChatGPTPrompt,
  base_context,
  getGPTTasks,
  getMessageContent,
  useGPTContext,
} from "./utils";
import { GettingStarted } from "./GetStarted";
import { GPTPrompt } from "./GPTPrompt";

type AskGPTProps = {
  onOutsideClick?: () => void;
};

export function AskAI(props: AskGPTProps) {
  const { onOutsideClick } = props;
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const messageContainerRef = React.useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<TChatGPTPrompt[]>([]);
  const context = useGPTContext(messages[messages.length - 1]);
  const [isLoading, setLoading] = useState(false);
  const location = useLocation();

  const tasks = useMemo(() => {
    return getGPTTasks(location.pathname);
  }, [location.pathname]);

  const [task, setTask] = useState(tasks[0]?.id);

  const handleOutsideClick = useCallback(
    (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onOutsideClick?.();
      }
    },
    [onOutsideClick],
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    const query = messages[messages.length - 1]?.content;
    if (!query) return;
    if (!isLoading) return;
    fireQuery(query, context);
  }, [context]);

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
    const message = {
      role: "user",
      content: query,
    };
    setMessages((messages: any) => [...messages, message]);
  }, [isLoading, query]);

  const fireQuery = async (query: string, context: TChatGPTContext) => {
    setQuery("");
    try {
      const res: any = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: ``,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              ...base_context,
              {
                role: "user",
                content: getMessageContent(query, task, context),
              },
            ],
          }),
        },
      );
      const result = await res.json();
      const message = result.choices?.[0]?.message;
      setMessages((messages: any) => [...messages, message]);
      setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  };

  return (
    <div
      ref={ref}
      className="flex flex-col justify-between h-full w-full overflow-hidden"
    >
      <div className="text-lg items-center gap-2 flex font-semibold flex-shrink-0 px-4 pt-4 pb-2 flex-row justify-start">
        Ask AI
        <BetaCard />
      </div>
      <div
        className="flex flex-col justify-start gap-2 px-4 pb-2 overflow-auto"
        style={{ height: "calc(100% - 150px)" }}
      >
        {messages.length ? (
          <div
            className="flex flex-col gap-2 w-full justify-start"
            ref={messageContainerRef}
          >
            {messages.map((r: any, idx: number) => (
              <GPTPrompt done key={idx} response={r.content} role={r.role} />
            ))}
          </div>
        ) : (
          <GettingStarted
            onClick={(query: string) => setQuery(query)}
            task={task}
          />
        )}
      </div>
      <div className="flex flex-col flex-shrink-0 gap-2 p-4 bg-gray-100">
        <div className="flex flex-row justify-between items-center">
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
          <span className="text-sm font-medium">{query.length}/500</span>
        </div>
        <form
          onSubmit={() => sendQuery()}
          className="flex w-full relative items-center justify-between"
        >
          <TextArea
            className="border border-gray-300 rounded-md p-2 flex-1 h-7 !pr-4 max-h-28"
            disabled={isLoading}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type in your query here"
            value={query}
            intent="none"
            style={{ resize: "none", overflow: "hidden" }}
            growVertically
          />
          {isLoading ? (
            <div className="!h-9 absolute right-2 flex items-center">
              <Spinner size={IconSize.LARGE} />
            </div>
          ) : (
            <Send
              className="!h-9 absolute right-2 hover:fill-slate-800 cursor-pointer"
              color="lightgray"
              size={16}
              onClick={() => sendQuery()}
            />
          )}
        </form>
      </div>
    </div>
  );
}

/**
 * To enable streaming
 * // const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    // let resString = "";
    // await new ReadableStream({
    //   async start(controller) {
    //     while (true) {
    //       const { done, value } = await reader.read();

    //       // When no more data needs to be consumed, break the reading
    //       if (done) {
    //         break;
    //       }

    //       let data = value.split("data:").filter(Boolean);
    //       try {
    //         data = data.map((d: any) => JSON.parse(d));
    //       } catch (e) {
    //         debugger;
            // console.log("error", e);
    //         break;
    //       }
    //       const dataText = data.map((d: any) => d.choices?.[0].delta?.content);
    //       resString += dataText.join(" ");
    //       setResults(resString);
    //       // Enqueue the next data chunk into our target stream
    //       controller.enqueue(value);
    //     }
    //     // Close the stream
    //     controller.close();
    //     reader.releaseLock();
    //     setMessages((messages: any) => [
    //       ...messages,
    //       { role: "assistant", content: resString },
    //     ]);
    //     setResults("");
    //   },
    // });
 */
