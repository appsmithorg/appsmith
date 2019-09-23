import { ContentType, EncodingType } from "../constants/ApiConstants";

export interface APIHeaders {
  "Content-Type": ContentType;
  "Accept-Encoding": EncodingType;
}

export interface APIRequest {
  requestId?: string;
}
