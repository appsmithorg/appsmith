import React from "react";
import { GPTTask } from "./utils";
import { UserPrompt } from "./GPTPrompt";

const examplePrompts = {
  [GPTTask.JS_EXPRESSION]: [
    "Filter users by age > 30 from response of get_users api?",
    "Pick first name and last name from response of get_users api?",
    "Run get_users api and display a toast message 'Success' on success and 'Error' on error?",
  ],
  [GPTTask.JS_FUNCTION]: [
    "Executes get_users api and filters the results by age > 30",
    "Setup a timer to execute get_users api after 5 seconds",
    "Calls getUserName function from get_users_utils js object and capitalizes the result",
    "Setup a timer to run get_users every 5 seconds",
  ],
  [GPTTask.SQL_QUERY]: [],
};

export function GettingStarted({
  onClick,
  task,
}: {
  onClick: (text: string) => void;
  task: GPTTask;
}) {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-1">
        {/* <div className="text-md font-medium">Getting started</div> */}
        <p className="text-[13px]">
          Quickly generate JS bindings and code snippets typing a prompt.
        </p>
        <div className="flex flex-col gap-2 pt-2">
          <div className="text-xs font-medium">Example Prompts</div>
          <div className="flex flex-col gap-2">
            {examplePrompts[task].map((prompt) => (
              <ExamplePrompt key={prompt} onClick={onClick} prompt={prompt} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExamplePrompt({
  prompt,
}: {
  prompt: string;
  onClick: (text: string) => void;
}) {
  return (
    <div className="flex justify-start bg-gray-100 w-full font-medium">
      <UserPrompt>{prompt}</UserPrompt>
    </div>
  );
}
