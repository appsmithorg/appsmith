import { Diff } from "deep-diff";
import { Datasource } from "entities/Datasource";
import ReplayEntity from "../index";
import { pathArrayToString } from "../replayUtils";

export default class ReplayDatasource extends ReplayEntity<Datasource> {
  constructor(entity: Datasource) {
    super(entity);
  }
  public processDiff(diff: Diff<Datasource, Datasource>, replay: any): void {
    if (!diff || !diff.path || !diff.path.length) return;
    const { kind, path } = diff;
    const modifiedProperty = pathArrayToString(path);
    Object.assign(replay, { modifiedProperty, kind });
  }
}
