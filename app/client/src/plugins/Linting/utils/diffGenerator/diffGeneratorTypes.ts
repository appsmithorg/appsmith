import type { IEntity } from "@appsmith/plugins/Linting/lib/entity/types";
import type { Diff } from "deep-diff";

export interface EntityDiffGenerator {
  generate(
    baseEntity?: IEntity,
    compareEntity?: IEntity,
  ): Diff<unknown>[] | undefined;
}
