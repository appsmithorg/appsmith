import { ContentType, DataType } from "../constants/ApiConstants";

export interface APIHeaders {
  Accept: ContentType;
  "Content-Type": ContentType;
  dataType: DataType;
}

export interface APIRequest {
  requestId?: string;
}
