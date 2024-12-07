export interface UpdateGlobalProfileRequestParams {
  authorName: string;
  authorEmail: string;
}

export interface UpdateGlobalProfileResponse {
  default: {
    authorName: string;
    authorEmail: string;
  };
}
