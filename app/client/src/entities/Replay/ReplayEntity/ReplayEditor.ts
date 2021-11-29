import { Diff } from "deep-diff";
import { Action } from "entities/Action";
import ReplayEntity from "..";
import { pathArrayToString } from "../replayUtils";
import { JSAction } from "entities/JSCollection";
import { Datasource } from "entities/Datasource";
import { ENTITY_TYPE } from "entities/AppsmithConsole";

export type ReplayEditorUpdate<T> = {
  modifiedProperty: string;
  index?: number;
  update: T | Diff<T, T>;
  kind: "N" | "D" | "E" | "A";
  isUndo?: boolean;
};
export default class ReplayEditor<
  T extends Action | JSAction | Datasource
> extends ReplayEntity<T> {
  constructor(entity: T, entityType: ENTITY_TYPE) {
    super(entity, entityType);
  }

  public processDiff(diff: Diff<T, T>, replay: any, isUndo: boolean): void {
    if (!diff || !diff.path || !diff.path.length) return;
    replay.updates = (replay.updates || []).concat(
      this.getChanges(diff, isUndo) || [],
    );
  }

  /*
    The should get us the modified property (configProperty from editor, settings and form json files), the updated value and the kind of update.
    The modifiedProperty would be used to highlight the field that has been replayed. We might need to use the kind in future to display toast
    messages or even highlight based on the kind.
  */
  private getChanges(
    diff: Diff<T, T>,
    isUndo: boolean,
  ): ReplayEditorUpdate<T> | undefined {
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
      if (diff.lhs === diff.rhs) return;
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
