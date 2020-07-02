import { Datasource } from "api/DatasourcesApi";

export type EmbeddedDatasource = Omit<Datasource, "id">;

export const DEFAULT_DATASOURCE = (pluginId: string): EmbeddedDatasource => ({
  name: "DEFAULT_REST_DATASOURCE",
  datasourceConfiguration: {
    url: "",
  },
  invalids: [],
  isValid: true,
  pluginId,
});
