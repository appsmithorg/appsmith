import type { IEntity } from "../entity";
import { diff, type Diff } from "deep-diff";

export interface EntityDiffGenerator {
  generate(
    baseEntity?: IEntity,
    compareEntity?: IEntity,
  ): Diff<unknown>[] | undefined;
}

export class DefaultDiffGenerator implements EntityDiffGenerator {
  generate(baseEntity?: IEntity, compareEntity?: IEntity) {
    return diff(
      this.generateDiffObj(baseEntity),
      this.generateDiffObj(compareEntity),
    );
  }
  generateDiffObj(entity?: IEntity) {
    if (!entity) {
      return {};
    }
    return { [entity.getName()]: entity.getRawEntity() };
  }
}

export const defaultDiffGenerator = new DefaultDiffGenerator();
