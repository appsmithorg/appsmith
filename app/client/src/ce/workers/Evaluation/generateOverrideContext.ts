import type { DataTree } from "entities/DataTree/dataTreeTypes";

export interface GenerateOverrideContextProps {
  bindings: string[];
  dataTree: DataTree;
  executionParams: Record<string, unknown>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function generateOverrideContext(props: GenerateOverrideContextProps) {
  return {};
}

export default generateOverrideContext;
