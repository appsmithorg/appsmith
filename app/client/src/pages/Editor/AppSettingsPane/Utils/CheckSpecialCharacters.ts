export const checkSpecialCharacters = (
  checkEmpty: boolean,
  callback: (isValid: boolean) => void,
) => {
  return (value: string) => {
    const noSpecialCharactersRegEx = /^[A-Za-z0-9\-]+$/;

    const isEmpty = value.length === 0;
    const hasSpecialCharacters =
      !isEmpty && !noSpecialCharactersRegEx.test(value);
    const hasError = (checkEmpty && isEmpty) || hasSpecialCharacters;

    callback(!hasError);

    let message = "";
    if (checkEmpty && isEmpty) message = "Cannot be empty";
    else if (hasSpecialCharacters)
      message = "No special characters allowed (except -)";

    return {
      isValid: !hasError,
      message,
    };
  };
};
