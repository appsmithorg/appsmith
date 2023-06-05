import React, { useState } from "react";
import { GPTTask } from "./utils";
// import { UserPromptWrapper } from "./GPTPrompt";
import { Collapse } from "@blueprintjs/core";
import { Icon } from "design-system";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";

export const examplePrompts: Record<string, any> = {
  [GPTTask.JS_EXPRESSION]: {
    [AutocompleteDataType.ARRAY]:
      "Filter users by age > 30 from response of get_users api?",
    [AutocompleteDataType.FUNCTION]:
      "Run get_users api and display a toast message 'Success' on success and 'Error' on error?",
    [AutocompleteDataType.OBJECT]: "Get admin from get_users api",
    [AutocompleteDataType.UNKNOWN]:
      "Run get_users api and display a toast message 'Success' on success and 'Error' on error?",
    [AutocompleteDataType.STRING]: "Get first user name from get_users api",
  },
};

export function GettingStarted() {
  // const task = useGPTTask();
  const [showExamplePrompt, toggleExamplePrompt] = useState<boolean>(false);
  return (
    <div className="flex flex-col">
      <div
        className="text-xs font-medium flex"
        onClick={() => toggleExamplePrompt(!showExamplePrompt)}
      >
        {showExamplePrompt ? (
          <Icon name="arrow-down-s-line" size="sm" />
        ) : (
          <Icon name="arrow-right-s-line" size="sm" />
        )}
        Example Prompts
      </div>
      <Collapse isOpen={showExamplePrompt}>
        <div className="flex flex-col gap-2">
          {/* {examplePrompts[task.id].map((prompt) => (
            <ExamplePrompt key={prompt} prompt={prompt} />
          ))} */}
        </div>
      </Collapse>
    </div>
  );
}

// function ExamplePrompt({ prompt }: { prompt: string }) {
//   return (
//     <div className="flex justify-start bg-gray-100 w-full font-normal">
//       <UserPromptWrapper>{prompt}</UserPromptWrapper>
//     </div>
//   );
// }
