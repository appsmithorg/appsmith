import type { AutocompletionDefinitions } from "widgets/constants";

export const useBaseWidgetAutoComplete = () => {
  const getAutocompleteDefinitions = (
    autoCompleteDefinitions: AutocompletionDefinitions = {},
  ) => {
    return autoCompleteDefinitions;
  };
  return {
    getAutocompleteDefinitions,
  };
};
