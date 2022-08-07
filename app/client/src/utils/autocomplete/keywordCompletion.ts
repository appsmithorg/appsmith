import { Completion } from "./TernServer";

const ifCompletionStatement = `if (condition) { \n }`;

export const getCompletionsForKeyword = (completion: Completion) => {
  const keywordName = completion.text;
  const completions = [];
  switch (keywordName) {
    // loops
    case "for":
      completions.push({
        ...completion,
        name: "for-loop",
        text: `for(let i=0;i < array.length;i++){
          const element = array[i];
        }`,
        render: (element: HTMLElement) => {
          element.setAttribute("keyword", "For Loop");
          element.innerHTML = completion.text;
        },
      });
      completions.push({
        ...completion,
        name: "for-in-loop",
        text: `for (const key in object) {
        }`,
        render: (element: HTMLElement) => {
          element.setAttribute("keyword", "For-in Loop");
          element.innerHTML = "forin";
        },
      });
      break;

    case "while":
      completions.push({
        ...completion,
        name: "while-loop",
        text: `while (condition) {
        }`,
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
        text: `do {
  
        } while (condition);`,
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
        text: ifCompletionStatement,
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
        text: `switch (key) {
          case value:
            
            break;
          default:
            break;
        }`,
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
        text: `function name(params) {
  
        }`,
        render: (element: HTMLElement) => {
          element.setAttribute("keyword", "Function Statement");
          element.innerHTML = completion.text;
        },
      });

      break;
    case "class":
      completions.push({
        ...completion,
        name: "class-statement",
        text: `class name {
          constructor(parameters) {
            
          }
        }`,
        render: (element: HTMLElement) => {
          element.setAttribute("keyword", "Class Definition");
          element.innerHTML = completion.text;
        },
      });
      break;
    case "try":
      completions.push({
        ...completion,
        name: "try-catch",
        text: `try {
  
        } catch (error) {
          
        }`,
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
