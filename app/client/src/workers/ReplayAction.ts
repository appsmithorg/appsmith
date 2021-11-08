import { Diff } from "deep-diff";
import { Action } from "entities/Action";
import { TOASTS } from "./ReplayCanvas";
import ReplayEntity from "./ReplayEntity";
import { addToArray, pathArrayToString } from "./replayUtils";

export default class ReplayAction extends ReplayEntity<Action> {
  constructor(entity: Action) {
    super(entity);
  }

  public processDiff(diff: Diff<Action, Action>, replay: any): void {
    if (!diff || !diff.path || !diff.path.length) return;
    const toast = this.createToast(diff);
    addToArray(replay, TOASTS, toast);
  }

  private createToast(diff: Diff<Action, Action>) {
    return {
      modifiedProperty: pathArrayToString(diff.path),
      kind: diff.kind,
    };
  }
}
