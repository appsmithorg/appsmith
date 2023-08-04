import type { AutocompletionDefinitions } from "widgets/constants";

export interface BaseWidgetAutoComplete {
  getAutocompleteDefinitions: (
    autoCompleteDefinitions?: AutocompletionDefinitions,
  ) => AutocompletionDefinitions;
}

export const useBaseWidgetAutoComplete = (): BaseWidgetAutoComplete => {
  const getAutocompleteDefinitions = (
    autoCompleteDefinitions: AutocompletionDefinitions = {},
  ) => {
    return autoCompleteDefinitions;
  };
  return {
    getAutocompleteDefinitions,
  };
};
