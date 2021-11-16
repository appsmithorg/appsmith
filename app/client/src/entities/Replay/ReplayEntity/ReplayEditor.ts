import { Diff } from "deep-diff";
import { Action } from "entities/Action";
import ReplayEntity from "..";
import { pathArrayToString } from "../replayUtils";
import { JSAction } from "entities/JSCollection";
import { Datasource } from "entities/Datasource";
export default class ReplayAction<
  T extends Action | JSAction | Datasource
> extends ReplayEntity<T> {
  constructor(entity: T) {
    super(entity);
  }

  public processDiff(diff: Diff<T, T>, replay: any, isUndo: boolean): void {
    if (!diff || !diff.path || !diff.path.length) return;
    replay.updates = (replay.update || []).concat(
      this.getChanges(diff, isUndo),
    );
  }

  public getChanges(diff: Diff<T, T>, isUndo: boolean) {
    const { kind, path } = diff;
    if (diff.kind === "N") {
      return {
        modifiedProperty: pathArrayToString(path),
        update: diff.rhs,
        kind,
      };
    } else if (diff.kind === "A") {
      return {
        modifiedProperty: pathArrayToString(path),
        update: diff.item,
        index: diff.index,
        kind,
        isUndo,
      };
    } else if (diff.kind === "E") {
      return {
        modifiedProperty: pathArrayToString(path),
        update: isUndo ? diff.lhs : diff.rhs,
        kind,
      };
    }
    return {
      modifiedProperty: pathArrayToString(path),
      update: diff.lhs,
      kind,
    };
  }
}
