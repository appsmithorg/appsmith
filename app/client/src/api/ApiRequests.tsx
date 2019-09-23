import { ContentType } from "../constants/ApiConstants";

export interface APIHeaders {
  "Content-Type": ContentType;
}

export interface APIRequest {
  requestId?: string;
}
