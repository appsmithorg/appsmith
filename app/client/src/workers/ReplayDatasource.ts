import { Diff } from "deep-diff";
import { Datasource } from "entities/Datasource";
import ReplayEntity from "./ReplayEntity";

export default class ReplayDatasource extends ReplayEntity<Datasource> {
  constructor(entity: Datasource) {
    super(entity);
  }
  processDiff(
    diff: Diff<Datasource, Datasource>,
    replay: any,
    isUndo: boolean,
  ) {
    return replay;
  }
}
