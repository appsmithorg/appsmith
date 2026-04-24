import type { Completion, TernCompletionResult } from "./CodemirrorTernService";
import { renderKeywordHint } from "./keywordHintRenderer";

export const getCompletionsForKeyword = (
  completion: Completion<TernCompletionResult>,
  cursorHorizontalPos: number,
) => {
  const keywordName = completion.text;
  // indentation needs to be positive number
  const indentation = cursorHorizontalPos < 0 ? 0 : cursorHorizontalPos;
  const indentationSpace = " ".repeat(indentation);

  const completions = [];

  switch (keywordName) {
    // loops
    case "for":
      completions.push({
        ...completion,
        name: "for-loop",
        text: `for(let i=0;i < array.length;i++){\n${indentationSpace}\tconst element = array[i];\n${indentationSpace}}`,
        render: (element: HTMLElement) => {
          renderKeywordHint(element, completion.text, "For Loop");
        },
      });
      completions.push({
        ...completion,
        name: "for-in-loop",
        text: `for(const key in object) {\n${indentationSpace}}`,
        render: (element: HTMLElement) => {
          renderKeywordHint(element, "forin", "For-in Loop");
        },
      });
      completions.push({
        ...completion,
        name: "for-of-loop",
        text: `for(const iterator of object){\n${indentationSpace}}`,
        render: (element: HTMLElement) => {
          renderKeywordHint(element, "forof", "For-of Loop");
        },
      });
      break;

    case "while":
      completions.push({
        ...completion,
        name: "while-loop",
        text: `while(condition){\n${indentationSpace}}`,
        render: (element: HTMLElement) => {
          renderKeywordHint(element, completion.text, "While Statement");
        },
      });
      break;

    case "do":
      completions.push({
        ...completion,
        name: "do-while-statement",
        text: `do{\n\n${indentationSpace}} while (condition);`,
        render: (element: HTMLElement) => {
          renderKeywordHint(element, completion.text, "do-While Statement");
        },
      });
      break;

    // conditional statement
    case "if":
      completions.push({
        ...completion,
        name: "if-statement",
        text: `if(condition){\n\n${indentationSpace}}`,
        render: (element: HTMLElement) => {
          renderKeywordHint(element, completion.text, "if Statement");
        },
      });

      break;
    case "switch":
      completions.push({
        ...completion,
        name: "switch-statement",
        text: `switch(key){\n${indentationSpace}\tcase value:\n${indentationSpace}\t\tbreak;\n${indentationSpace}\tdefault:\n${indentationSpace}\t\tbreak;\n${indentationSpace}}`,
        render: (element: HTMLElement) => {
          renderKeywordHint(element, completion.text, "Switch Statement");
        },
      });

      break;
    case "function":
      completions.push({
        ...completion,
        name: "function-statement",
        text: `function name(params){\n\n${indentationSpace}}`,
        render: (element: HTMLElement) => {
          renderKeywordHint(element, completion.text, "Function Statement");
        },
      });

      break;
    case "try":
      completions.push({
        ...completion,
        name: "try-catch",
        text: `try{\n\n${indentationSpace}}catch(error){\n\n${indentationSpace}}`,
        render: (element: HTMLElement) => {
          renderKeywordHint(element, "try-catch", "Try-catch Statement");
        },
      });
      break;

    case "throw":
      completions.push({
        ...completion,
        name: "throw-exception",
        text: `throw new Error("");`,
        render: (element: HTMLElement) => {
          renderKeywordHint(element, completion.text, "Throw Exception");
        },
      });
      break;
    case "new":
      completions.push({
        ...completion,
        name: "new-statement",
        text: `const name = new type(arguments);`,
        render: (element: HTMLElement) => {
          renderKeywordHint(element, completion.text, "new Statement");
        },
      });
      break;
    case "async":
      completions.push(
        {
          ...completion,
          name: "async-function",
          text: `async function() {\n\n${indentationSpace}}`,
          render: (element: HTMLElement) => {
            renderKeywordHint(
              element,
              completion.text,
              "async Function Statement",
            );
          },
        },
        {
          ...completion,
          name: "async-arrow-function",
          text: `async () => {\n\n${indentationSpace}}`,
          render: (element: HTMLElement) => {
            renderKeywordHint(
              element,
              completion.text,
              "async Arrow Function Statement",
            );
          },
        },
      );
      break;
  }

  return completions;
};
