import type { DropdownOption } from "design-system-old";
import type { DatasourceTable } from "entities/Datasource";

export type QueryGeneratorFromProps = any;

export interface DatasourceTableDropdownOption extends DropdownOption {
  data: DatasourceTable;
}

export interface DropdownOptionType extends DropdownOption {
  id: string;
}
