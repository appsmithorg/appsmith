import type { AxiosPromise } from "axios";
import Api from "api/Api";
import type { ImportedCollections } from "constants/collectionsConstants";

class ImportedCollectionsApi extends Api {
  static importedCollectionsURL = "v1/import/templateCollections";
  static async fetchImportedCollections(): Promise<
    AxiosPromise<ImportedCollections>
  > {
    return Api.get(ImportedCollectionsApi.importedCollectionsURL);
  }
}

export default ImportedCollectionsApi;
