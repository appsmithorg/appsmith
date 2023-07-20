import type { EntityInfo } from "./types";

export default abstract class PaneNavigation {
  protected entityInfo: EntityInfo;

  constructor(entityInfo: EntityInfo) {
    this.entityInfo = entityInfo;
  }

  // Get the entity information
  abstract init(): void;
  // Get all information required to perform navigation actions
  protected abstract getConfig(): void;
  // Perform navigation actions
  abstract navigate(): void;
}
