import type { ApiResponse } from "api/ApiResponses";

export interface TemplateList {
  id: string;
  delete: boolean;
  name: string;
  providerId: string;
  publisher: string;
  packageName: string;
  versionId: string;
}

export interface CollectionDataArray {
  id: string;
  deleted: boolean;
  apiTemplateList: Array<TemplateList>;
}

export type ImportedCollections = ApiResponse & {
  data: Array<CollectionDataArray>;
};
