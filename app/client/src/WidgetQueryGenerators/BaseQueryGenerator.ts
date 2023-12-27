import type { DatasourceStorage } from "entities/Datasource";

export class BaseQueryGenerator {
  static getConnectionMode(
    datasourceConfiguration: DatasourceStorage["datasourceConfiguration"],
  ) {
    return datasourceConfiguration?.connection?.mode;
  }
}
