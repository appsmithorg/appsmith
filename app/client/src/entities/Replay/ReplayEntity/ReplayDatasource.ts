import { Diff } from "deep-diff";
import { Datasource } from "entities/Datasource";
import ReplayEntity from "../index";
import { addToArray, pathArrayToString, TOASTS } from "../replayUtils";

export default class ReplayDatasource extends ReplayEntity<Datasource> {
  constructor(entity: Datasource) {
    super(entity);
  }
  public processDiff(diff: Diff<Datasource, Datasource>, replay: any): void {
    if (!diff || !diff.path || !diff.path.length) return;
    const toast = this.createToast(diff);
    addToArray(replay, TOASTS, toast);
  }

  private createToast(diff: Diff<Datasource, Datasource>) {
    return {
      modifiedProperty: pathArrayToString(diff.path),
      kind: diff.kind,
    };
  }
}
