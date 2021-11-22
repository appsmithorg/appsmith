export type GeneratePagePayload = {
  tableName: string;
  columns?: string[];
  searchColumn?: string;
  pluginSpecificParams?: Record<any, any>;
};

import { DropdownOption } from "components/ads/Dropdown";
import { DatasourceTable } from "entities/Datasource";

export type DropdownOptions = Array<DropdownOption>;

export interface DatasourceTableDropdownOption extends DropdownOption {
  data: DatasourceTable;
}
