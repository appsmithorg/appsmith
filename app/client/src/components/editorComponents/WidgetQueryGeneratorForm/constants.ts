import { PluginPackageName } from "entities/Plugin";

export const DROPDOWN_TRIGGER_DIMENSION = {
  HEIGHT: "36px",
  WIDTH: "100%",
};

export const DROPDOWN_DIMENSION = {
  HEIGHT: "300px",
  WIDTH: "100%",
};

export const DEFAULT_DROPDOWN_OPTION = {
  id: "- Select -",
  label: "",
  value: "",
  data: {},
};

export const PluginFormInputFieldMap: Record<
  string,
  { DATASOURCE: string; TABLE: string; COLUMN: string }
> = {
  [PluginPackageName.MONGO]: {
    DATASOURCE: "MongoDB",
    TABLE: "collection",
    COLUMN: "field",
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

export const DEFAULT_QUERY_OPTIONS_COUNTS_TO_SHOW = 4;

export const PRIMARY_KEYS_MESSAGE = () =>
  "Tables without primary keys are disabled as they are required for reliable data operations.";

export const NO_PRIMARY_KEYS_MESSAGE = () => "No primary keys";
