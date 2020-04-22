import { ApiResponse } from "api/ApiResponses";

export type TemplateList = {
  id: string;
  delete: boolean;
  name: string;
  providerId: string;
  publisher: string;
  packageName: string;
  versionId: string;
};

export type CollectionDataArray = {
  id: string;
  deleted: boolean;
  apiTemplateList: Array<TemplateList>;
};

export type ImportedCollections = ApiResponse & {
  data: Array<CollectionDataArray>;
};
