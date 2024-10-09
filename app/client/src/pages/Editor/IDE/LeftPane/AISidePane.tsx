import React from "react";
import PaneHeader from "./PaneHeader";
import { Flex, Input, Button } from "@appsmith/ads";
import axios from "axios";

const apiKey = "YOUR_API";
const apiEndpoint = "https://api.openai.com/v1/chat/completions";

async function sendMessageWithCustomPrompt(userInput: string) {
  try {
    const response = await axios.post(
      apiEndpoint,
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a low code platform assistant for a user. You can help in binding data to table. which requires table widget name and data to be binded. this data can be something like Query1.data, API1.data etc. where Query1 and API1 are the names of the widgets and data is the property of the widget.",
          },
          {
            role: "user",
            content: userInput,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    const result = response.data;

    return result;

    // console.log(result);

    //   if (result.choices[0].finish_reason === "function_call") {
    //     const functionCall = result.choices[0].message.function_call;

    //     console.log("Function to call:", functionCall.name);
    //     console.log("Parameters:", functionCall.arguments);

    //     // Handle the function call (for example, adding the task)
    //     if (functionCall.name === "addTask") {
    //       const { deadline, title } = JSON.parse(functionCall.arguments);

    //       addTaskToDatabase(title, deadline); // Your function to add the task to the database
    //     }
    //   } else {
    //     console.log("GPT Response:", result.choices[0].message.content);
    //   }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    // console.error(
    //   "Error:",
    //   error.response ? error.response.data : error.message,
    // );
  }
}

const AISidePane = () => {
  const [text, setText] = React.useState("");

  return (
    <Flex
      borderRight="1px solid var(--ads-v2-color-border)"
      flexDirection="column"
      height="100%"
      width={"100%"}
    >
      <PaneHeader title="Ask AI" />
      <Flex flexDirection={"column"} height="100%" justifyContent={"flex-end"}>
        <Flex
          alignItems={"center"}
          gap={"spaces-2"}
          justifyContent={"center"}
          px={"spaces-2"}
          py={"spaces-4"}
          width={"100%"}
        >
          <Input
            onChange={(v) => setText(v)}
            placeholder="Ask AI"
            size="md"
            type="text"
            value={text}
          />
          <Button
            isIconButton
            onClick={async () => sendMessageWithCustomPrompt(text)}
            size="md"
            startIcon="play-line"
          />
        </Flex>
      </Flex>
    </Flex>
  );
};

export default AISidePane;
