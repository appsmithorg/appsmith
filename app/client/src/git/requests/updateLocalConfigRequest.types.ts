export interface UpdateLocalConfigRequestParams {
  authorName: string;
  authorEmail: string;
  useGlobalProfile: boolean;
}

export interface UpdateLocalConfigResponse {
  [baseApplicationId: string]: {
    authorName: string;
    authorEmail: string;
    useGlobalProfile: boolean;
  };
}
