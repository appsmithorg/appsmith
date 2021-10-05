import { DropdownOption } from "components/ads/Dropdown";
import { DatasourceTable } from "entities/Datasource";

export type DropdownOptions = Array<DropdownOption>;

export interface DatasourceTableDropdownOption extends DropdownOption {
  data: DatasourceTable;
}

export const PLUGIN_PACKAGE_NAME = {
  MONGO_DB: "mongo-plugin",
  S3: "amazons3-plugin",
  GOOGLE_SHEETS: "google-sheets-plugin",
  FIRESTORE: "firestore-plugin",
};

export const PluginFormInputFieldMap: Record<
  string,
  { DATASOURCE: string; TABLE: string; COLUMN: string }
> = {
  [PLUGIN_PACKAGE_NAME.MONGO_DB]: {
    DATASOURCE: "MongoDB",
    TABLE: "collection",
    COLUMN: "field",
  },
  [PLUGIN_PACKAGE_NAME.S3]: {
    DATASOURCE: "S3",
    TABLE: "bucket",
    COLUMN: "keys",
  },
  [PLUGIN_PACKAGE_NAME.GOOGLE_SHEETS]: {
    DATASOURCE: "Google Sheets",
    TABLE: "spreadsheet",
    COLUMN: "keys",
  },
  DEFAULT: {
    DATASOURCE: "SQL Based",
    TABLE: "table",
    COLUMN: "column",
  },
};

export const DROPDOWN_DIMENSION = {
  HEIGHT: "36px",
  WIDTH: "404px",
};

export const DEFAULT_DROPDOWN_OPTION = {
  id: "- Select -",
  label: "- Select -",
  value: "",
  onSelect: () => null,
  data: {},
};

export const ALLOWED_SEARCH_DATATYPE = [
  "text",
  "string",
  "char",
  "varchar",
  "character",
  "text string",
];
