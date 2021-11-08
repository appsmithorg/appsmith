import { Diff } from "deep-diff";
import { Action } from "entities/Action";
import ReplayEntity from "./ReplayEntity";

export default class ReplayAction extends ReplayEntity<Action> {
  constructor(entity: Action) {
    super(entity);
  }

  public processDiff(
    diff: Diff<Action, Action>,
    replay: any,
    isUndo: boolean,
  ): void {
    let x = "Arun";
    x = x.toLocaleLowerCase();
  }
}
