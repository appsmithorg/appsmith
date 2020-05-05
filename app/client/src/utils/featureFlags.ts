export enum FeatureFlagEnum {
  ApiPaneV2 = "ApiPaneV2",
  DatasourcePane = "DatasourcePane",
  QueryPane = "QueryPane",
}

export const checkForFlag = (flagName: FeatureFlagEnum) => {
  return localStorage.getItem(flagName);
};
