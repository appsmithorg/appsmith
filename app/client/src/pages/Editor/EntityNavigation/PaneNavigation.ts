import type { EntityInfo } from "./types";

export default abstract class PaneNavigation {
  protected entityInfo: EntityInfo;

  constructor(entityInfo: EntityInfo) {
    this.entityInfo = entityInfo;
  }

  abstract init(): void;
  protected abstract getConfig(): void;
  abstract navigate(): void;
}
