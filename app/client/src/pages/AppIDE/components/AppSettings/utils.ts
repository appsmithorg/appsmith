export const filterAccentedAndSpecialCharacters = (value: string) => {
  return decodeURI(value)
    .replaceAll(" ", "-")
    .replaceAll(/[^A-Za-z0-9-]/g, "");
};
