export const getCompletionTextForKeyword = (keyword: string) => {
  switch (keyword) {
    // loops
    case "for":
      return `for(let i=0;i < array.length;i++){
      const element = array[i];
    }`;
    case "while":
      return `while (condition) {
  
      }`;

    case "do":
      return `do {
  
      } while (condition);`;

    // conditional statement
    case "if":
      return `if (condition) {
  
      }`;

    case "switch":
      return `switch (key) {
        case value:
          
          break;
        default:
          break;
      }`;
    //
    case "function":
      return `function name(params) {
  
      }`;

    case "class":
      return `class name {
        constructor(parameters) {
          
        }
      }`;

    case "try":
      return `try {
  
      } catch (error) {
        
      }`;
    case "throw":
      return `throw new Error("");`;

    case "new":
      return `const name = new type(arguments);`;
    default:
      return keyword;
  }
};
