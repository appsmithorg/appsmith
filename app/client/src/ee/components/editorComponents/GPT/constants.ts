import { GPTTask } from "./utils";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";

// TODO: Delete this constant
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

export const PROMPT_INPUT_PLACEHOLDER =
  "I can generate JavaScript code, Ask me something.";

export const APPSMITH_AI_LINK =
  "https://appsmith.notion.site/AI-features-in-Appsmith-fd22891eb9b946e4916995cecf97a9ad";
