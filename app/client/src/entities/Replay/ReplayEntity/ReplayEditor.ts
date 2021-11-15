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

  public processDiff(diff: Diff<T, T>, replay: any): void {
    if (!diff || !diff.path || !diff.path.length) return;
    const { kind, path } = diff;
    const modifiedProperty = pathArrayToString(path);
    Object.assign(replay, { modifiedProperty, kind });
  }
}
