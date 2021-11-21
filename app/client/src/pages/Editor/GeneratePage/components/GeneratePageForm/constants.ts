import { DropdownOption } from "components/ads/Dropdown";
import { DatasourceTable } from "entities/Datasource";

export type DropdownOptions = Array<DropdownOption>;

export interface DatasourceTableDropdownOption extends DropdownOption {
  data: DatasourceTable;
}

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
