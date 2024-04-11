export type PaginationField = "PREV" | "NEXT";

export interface APIRequest {
  requestId?: string;
}

export interface Property {
  key: string;
  value?: string;
}

export interface ExecuteActionRequest extends APIRequest {
  actionId: string;
  params?: Property[];
  paginationField?: PaginationField;
  viewMode: boolean;
  paramProperties: Record<
    string,
    | string
    | Record<string, Array<string>>
    | Record<string, string>
    | Record<string, Record<string, Array<string>>>
  >;
  analyticsProperties?: Record<string, boolean>;
}

export interface FilePickerInstumentationObject {
  numberOfFiles: number;
  totalSize: number;
  fileTypes: Array<string>;
  fileSizes: Array<number>;
}
