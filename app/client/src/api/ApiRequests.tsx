import { ContentType, DataType } from "../constants/ApiConstants";

export interface APIHeaders {
  Accept?: ContentType;
  "Content-Type"?: ContentType;
  dataType?: DataType;
  Origin?: string;
}

export interface APIRequest {
  requestId?: string;
}
