import { ContentType, DataType, EncodingType } from "../constants/ApiConstants";
import { HttpMethod } from './Api';

export interface APIHeaders {
  Accept: ContentType
  "Content-Type": ContentType
  dataType: DataType
}

export interface APIRequest {
    
}

export interface CreateAPIRequest extends APIRequest {
  requestHeaders: Record<string, string>
  method: HttpMethod
  baseUrl: string
  path: string
  APIName: string
  body: JSON
  queryParams: Record<string, string>
}

export interface UpdateAPIRequest extends CreateAPIRequest {
  apiId: string
}