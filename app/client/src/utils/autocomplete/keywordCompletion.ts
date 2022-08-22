import { Completion } from "./TernServer";

export const getCompletionsForKeyword = (
  completion: Completion,
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
          element.setAttribute("keyword", "For Loop");
          element.innerHTML = completion.text;
        },
      });
      completions.push({
        ...completion,
        name: "for-in-loop",
        text: `for(const key in object) {\n${indentationSpace}}`,
        render: (element: HTMLElement) => {
          element.setAttribute("keyword", "For-in Loop");
          element.innerHTML = "forin";
        },
      });
      completions.push({
        ...completion,
        name: "for-of-loop",
        text: `for(const iterator of object){\n${indentationSpace}}`,
        render: (element: HTMLElement) => {
          element.setAttribute("keyword", "For-of Loop");
          element.innerHTML = "forof";
        },
      });
      break;

    case "while":
      completions.push({
        ...completion,
        name: "while-loop",
        text: `while(condition){\n${indentationSpace}}`,
        render: (element: HTMLElement) => {
          element.setAttribute("keyword", "While Statement");
          element.innerHTML = completion.text;
        },
      });
      break;

    case "do":
      completions.push({
        ...completion,
        name: "do-while-statement",
        text: `do{\n\n${indentationSpace}} while (condition);`,
        render: (element: HTMLElement) => {
          element.setAttribute("keyword", "do-While Statement");
          element.innerHTML = completion.text;
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
          element.setAttribute("keyword", "if Statement");
          element.innerHTML = completion.text;
        },
      });

      break;
    case "switch":
      completions.push({
        ...completion,
        name: "switch-statement",
        text: `switch(key){\n${indentationSpace}\tcase value:\n${indentationSpace}\t\tbreak;\n${indentationSpace}\tdefault:\n${indentationSpace}\t\tbreak;\n${indentationSpace}}`,
        render: (element: HTMLElement) => {
          element.setAttribute("keyword", "Switch Statement");
          element.innerHTML = completion.text;
        },
      });

      break;
    case "function":
      completions.push({
        ...completion,
        name: "function-statement",
        text: `function name(params){\n\n${indentationSpace}}`,
        render: (element: HTMLElement) => {
          element.setAttribute("keyword", "Function Statement");
          element.innerHTML = completion.text;
        },
      });

      break;
    case "try":
      completions.push({
        ...completion,
        name: "try-catch",
        text: `try{\n\n${indentationSpace}}catch(error){\n\n${indentationSpace}}`,
        render: (element: HTMLElement) => {
          element.setAttribute("keyword", "Try-catch Statement");
          element.innerHTML = "try-catch";
        },
      });
      break;

    case "throw":
      completions.push({
        ...completion,
        name: "throw-exception",
        text: `throw new Error("");`,
        render: (element: HTMLElement) => {
          element.setAttribute("keyword", "Throw Exception");
          element.innerHTML = completion.text;
        },
      });
      break;
    case "new":
      completions.push({
        ...completion,
        name: "new-statement",
        text: `const name = new type(arguments);`,
        render: (element: HTMLElement) => {
          element.setAttribute("keyword", "new Statement");
          element.innerHTML = completion.text;
        },
      });

      break;
  }

  return completions;
};
