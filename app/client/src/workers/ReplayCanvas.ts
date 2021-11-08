import { Diff } from "deep-diff";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import ReplayEntity from "./ReplayEntity";
import { set } from "lodash";
import { addToArray, setPropertyUpdate, UPDATES } from "./replayUtils";

export type DSLDiff = Diff<CanvasWidgetsReduxState, CanvasWidgetsReduxState>;

const positionProps = [
  "leftColumn",
  "rightColumn",
  "topRow",
  "bottomRow",
  "minHeight",
  "parentColumnSpace",
  "parentRowSpace",
  "children",
  "parentId",
  "renderMode",
  "detachFromLayout",
  "noContainerOffset",
  "isCanvas",
];

/**
 * checks property changed is a positional property
 *
 * @param widgetProperty
 * @returns
 */
function isPositionUpdate(widgetProperty: string) {
  return positionProps.indexOf(widgetProperty) !== -1;
}

export const TOASTS = "toasts";
export const FOCUSES = "needsFocus";
export const WIDGETS = "widgets";

export default class ReplayCanvas extends ReplayEntity<
  CanvasWidgetsReduxState
> {
  public constructor(entity: CanvasWidgetsReduxState) {
    super(entity);
  }

  public processDiff(diff: DSLDiff, replay: any, isUndo: boolean) {
    if (!diff || !diff.path || !diff.path.length || diff.path[0] === "0")
      return;

    const widgetId = diff.path[0];

    switch (diff.kind) {
      // new elements/deleted elements in dsl
      case "N":
      case "D":
        if (diff.path.length == 1) {
          const toast = this.createToast(
            diff.kind === "N" ? diff.rhs : diff.lhs,
            this.entity[widgetId],
            widgetId,
            isUndo,
            isUndo,
          );
          addToArray(replay, TOASTS, toast);
        } else {
          setPropertyUpdate(replay, [WIDGETS, widgetId, UPDATES], diff.path);
        }
        break;
      // element is edited
      case "E":
        if (isPositionUpdate(diff.path[diff.path.length - 1])) {
          set(replay, [WIDGETS, widgetId, FOCUSES], true);
        } else {
          setPropertyUpdate(replay, [WIDGETS, widgetId, UPDATES], diff.path);
        }
        break;
      default:
        break;
    }
  }
  private createToast(
    diffWidget: CanvasWidgetsReduxState,
    dslWidget: CanvasWidgetsReduxState | undefined,
    widgetId: string,
    isUndo: boolean,
    isCreated: boolean,
  ) {
    const widgetName = isCreated
      ? diffWidget.widgetName
      : dslWidget?.widgetName;
    return {
      isCreated,
      isUndo,
      widgetName,
      widgetId,
    };
  }
}
