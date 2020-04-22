export const API_PANE_V2 = "ApiPaneV2";

export const checkForFlag = (flagName: string) => {
  return localStorage.getItem(flagName);
};
