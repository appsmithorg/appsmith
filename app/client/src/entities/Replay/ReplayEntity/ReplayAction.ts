import { Diff } from "deep-diff";
import { Action } from "entities/Action";
import ReplayEntity from "..";
import { pathArrayToString } from "../replayUtils";
import { JSAction } from "entities/JSCollection";
import { Datasource } from "entities/Datasource";
export default class ReplayAction extends ReplayEntity<
  Action | JSAction | Datasource
> {
  constructor(entity: Action) {
    super(entity);
  }

  public processDiff(diff: Diff<Action, Action>, replay: any): void {
    if (!diff || !diff.path || !diff.path.length) return;
    const { kind, path } = diff;
    const modifiedProperty = pathArrayToString(path);
    Object.assign(replay, { modifiedProperty, kind });
  }
}
