import type { ActionOperation } from "components/editorComponents/GlobalSearch/utils";

export type GroupedAddOperations = Array<{
  title?: string;
  className: string;
  operations: ActionOperation[];
}>;
