export const useWorkflowOptions = () => {
  return [];
};

// We don't want to show the create new JS object option if the user is in the workflow editor
// this is done since worflows runner doesn't support multiple JS objects
// TODO: Remove this once workflows can support multiple JS objects
export const checkIfJSObjectCreationAllowed = () => {
  return false;
};
