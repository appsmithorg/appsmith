import type { DataTree } from "entities/DataTree/dataTreeTypes";
import type { DiffWithNewTreeState } from "workers/Evaluation/helpers";

export type EvaluatedTreeState = DataTree;

// Re-export for backward compatibility
export type { DataTree, DiffWithNewTreeState };
