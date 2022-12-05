export const checkRegex = (
  regex: RegExp,
  errorMessage: string,
  checkEmpty = true,
  callback?: (isValid: boolean) => void,
  emptyMessage = "Cannot be empty",
) => {
  return (value: string) => {
    const isEmpty = value.length === 0;
    const regexMismatch = !isEmpty && !regex.test(value);
    const hasError = (checkEmpty && isEmpty) || regexMismatch;

    callback?.(!hasError);

    let message = "";
    if (checkEmpty && isEmpty) message = emptyMessage;
    else if (regexMismatch) message = errorMessage;

    return {
      isValid: !hasError,
      message,
    };
  };
};
