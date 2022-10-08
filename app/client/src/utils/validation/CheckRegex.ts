export const checkRegex = (
  regex: RegExp,
  errorMessage: string,
  checkEmpty = true,
  callback?: (isValid: boolean) => void,
) => {
  return (value: string) => {
    const isEmpty = value.length === 0;
    const hasSpecialCharacters = !isEmpty && !regex.test(value);
    const hasError = (checkEmpty && isEmpty) || hasSpecialCharacters;

    callback?.(!hasError);

    let message = "";
    if (checkEmpty && isEmpty) message = "Cannot be empty";
    else if (hasSpecialCharacters) message = errorMessage;

    return {
      isValid: !hasError,
      message,
    };
  };
};
