import type { Diff } from "deep-diff";
import type { Action } from "entities/Action";
import ReplayEntity from "..";
import { pathArrayToString } from "../replayUtils";
import type { JSActionConfig } from "entities/JSCollection";
import type { Datasource } from "entities/Datasource";
import type { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";
import isEmpty from "lodash/isEmpty";
import type { Canvas } from "./ReplayCanvas";

/*
 This type represents all the form objects that can be undone/redone.
 (Action, datasource, jsAction etc)
*/
export type Replayable =
  | Partial<JSActionConfig>
  | Partial<Datasource>
  | Partial<Action>
  | Partial<Canvas>;

type ReplayEditorDiff = Diff<Replayable, Replayable>;

export interface ReplayEditorUpdate {
  modifiedProperty: string;
  index?: number;
  update: Replayable | ReplayEditorDiff;
  kind: "N" | "D" | "E" | "A";
  isUndo?: boolean;
}
export default class ReplayEditor extends ReplayEntity<Replayable> {
  constructor(entity: Replayable, entityType: ENTITY_TYPE) {
    super(entity, entityType);
  }

  public processDiff(
    diff: Diff<Replayable, Replayable>,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    replay: any,
    isUndo: boolean,
  ): void {
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
    diff: Diff<Replayable, Replayable>,
    isUndo: boolean,
  ): ReplayEditorUpdate | undefined {
    const { kind, path } = diff;
    if (diff.kind === "N") {
      if (isEmpty(diff.rhs)) return;
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
