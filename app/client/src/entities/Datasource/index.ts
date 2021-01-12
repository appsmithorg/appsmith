import { Property } from "entities/Action";
import _ from "lodash";
export interface DatasourceAuthentication {
  authType?: string;
  username?: string;
  password?: string;
}

export interface DatasourceColumns {
  name: string;
  type: string;
}

export interface DatasourceKeys {
  name: string;
  type: string;
}

export interface DatasourceStructure {
  tables?: DatasourceTable[];
}

export interface QueryTemplate {
  title: string;
  body: string;
}
export interface DatasourceTable {
  type: string;
  name: string;
  columns: DatasourceColumns[];
  keys: DatasourceKeys[];
  templates: QueryTemplate[];
}

// todo: check which fields are truly optional and move the common ones into base
interface BaseDatasource {
  pluginId: string;
  name: string;
  organizationId: string;
  isValid: boolean;
}

export const isEmbeddedRestDatasource = (
  val: any,
): val is EmbeddedRestDatasource => {
  if (!_.isObject(val)) return false;
  if (!("datasourceConfiguration" in val)) return false;
  val = <EmbeddedRestDatasource>val;
  // Object should exist and have value
  if (!val.datasourceConfiguration) return false;
  //url might exist as a key but not have value, so we won't check value
  if (!("url" in val.datasourceConfiguration)) return false;
  return true;
};

export interface EmbeddedRestDatasource extends BaseDatasource {
  datasourceConfiguration: { url: string };
  invalids: Array<string>;
}
export interface Datasource extends BaseDatasource {
  id: string;
  datasourceConfiguration: {
    url: string;
    authentication?: DatasourceAuthentication;
    properties?: Record<string, string>;
    headers?: Property[];
    databaseName?: string;
  };
  invalids?: string[];
  structure?: DatasourceStructure;
}

export const DEFAULT_DATASOURCE = (
  pluginId: string,
  organizationId: string,
): EmbeddedRestDatasource => ({
  name: "DEFAULT_REST_DATASOURCE",
  datasourceConfiguration: {
    url: "",
  },
  invalids: [],
  isValid: true,
  pluginId,
  organizationId,
});
