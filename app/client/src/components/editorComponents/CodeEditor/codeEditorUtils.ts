export const removeNewLineChars = (inputValue: any) => {
  return inputValue && inputValue.replace(/(\r\n|\n|\r)/gm, "");
};

export const getInputValue = (inputValue: any) => {
  if (typeof inputValue === "object") {
    inputValue = JSON.stringify(inputValue, null, 2);
  } else if (typeof inputValue === "number" || typeof inputValue === "string") {
    inputValue += "";
  }
  return inputValue;
};
