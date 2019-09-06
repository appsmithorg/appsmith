import { ContentType, DataType, EncodingType } from "../constants/ApiConstants";

export interface ApiHeaders {
  Accept: ContentType
  "Content-Type": ContentType
  dataType: DataType
}

export interface ApiRequest {
    
}
