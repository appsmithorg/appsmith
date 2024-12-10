export interface UpdateGlobalConfigRequestParams {
  authorName: string;
  authorEmail: string;
}

export interface UpdateGlobalConfigResponse {
  default: {
    authorName: string;
    authorEmail: string;
  };
}
