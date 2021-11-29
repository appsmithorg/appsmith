import { Diff } from "deep-diff";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import ReplayEntity from "../index";
import { set } from "lodash";
import {
  addToArray,
  FOCUSES,
  setPropertyUpdate,
  TOASTS,
  UPDATES,
  WIDGETS,
} from "../replayUtils";
import { ENTITY_TYPE } from "entities/AppsmithConsole";

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
export default class ReplayCanvas extends ReplayEntity<
  CanvasWidgetsReduxState
> {
  public constructor(entity: CanvasWidgetsReduxState) {
    super(entity, ENTITY_TYPE.WIDGET);
  }

  public processDiff(diff: DSLDiff, replay: any, isUndo: boolean) {
    if (!diff || !diff.path || !diff.path.length || diff.path[0] === "0")
      return;

    const widgetId = diff.path[0];

    switch (diff.kind) {
      // new elements is added in dsl
      case "N":
        if (diff.path.length == 1) {
          const toast = this.createToast(
            diff.rhs,
            this.entity[widgetId],
            widgetId,
            isUndo,
            !isUndo,
          );
          addToArray(replay, TOASTS, toast);
        } else {
          setPropertyUpdate(replay, [WIDGETS, widgetId, UPDATES], diff.path);
        }
        break;
      // element is deleted in dsl
      case "D":
        if (diff.path.length == 1) {
          const toast = this.createToast(
            diff.lhs,
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
