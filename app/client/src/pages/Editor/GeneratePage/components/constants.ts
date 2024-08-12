import type { DropdownOption } from "@appsmith/ads-old";
import type { DatasourceTable } from "entities/Datasource";
import { PluginPackageName } from "entities/Action";

export type DropdownOptions = Array<DropdownOption>;

export interface DatasourceTableDropdownOption extends DropdownOption {
  data: DatasourceTable;
}

export const PluginFormInputFieldMap: Record<
  string,
  { DATASOURCE: string; TABLE: string; COLUMN: string }
> = {
  [PluginPackageName.MONGO]: {
    DATASOURCE: "MongoDB",
    TABLE: "collection",
    COLUMN: "field",
  },
  [PluginPackageName.S3]: {
    DATASOURCE: "S3",
    TABLE: "bucket",
    COLUMN: "keys",
  },
  [PluginPackageName.GOOGLE_SHEETS]: {
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
