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
import { AppTheme } from "entities/AppTheming";
import { ENTITY_TYPE } from "entities/AppsmithConsole";

export type Canvas = {
  widgets: CanvasWidgetsReduxState;
  theme: AppTheme;
};
export type CanvasDiff = Diff<Canvas, Canvas>;
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
export default class ReplayCanvas extends ReplayEntity<Canvas> {
  public constructor(entity: Canvas) {
    super(entity, ENTITY_TYPE.WIDGET);
  }

  /**
   * process the diff
   *
   * @param diff
   * @param replay
   * @param isUndo
   * @returns
   */
  public processDiff(diff: CanvasDiff, replay: any, isUndo: boolean) {
    if (!diff || !diff.path || !diff.path.length || diff.path[1] === "0")
      return;

    if (diff.path.indexOf("widgets") > -1) {
      return this.processDiffForWidgets(diff, replay, isUndo);
    }

    if (diff.path.indexOf("theme") > -1) {
      return this.processDiffForTheme(diff, replay);
    }
  }

  /**
   * process diff related to app theming
   *
   * @param diff
   * @param replay
   * @param isUndo
   */
  public processDiffForTheme(diff: CanvasDiff, replay: any) {
    if (!diff || !diff.path || !diff.path.length || diff.path[1] === "0")
      return;

    set(replay, "theme", true);

    if (diff.path.join(".") === "theme.name") {
      set(replay, "themeChanged", true);
    }
  }

  /**
   * process diffs related to DSL ( widgets )
   *
   * @param diff
   * @param replay
   * @param isUndo
   * @returns
   */
  public processDiffForWidgets(diff: CanvasDiff, replay: any, isUndo: boolean) {
    if (!diff || !diff.path || !diff.path.length || diff.path[1] === "0")
      return;

    const widgetId = diff.path[1];

    switch (diff.kind) {
      // new elements is added in dsl
      case "N":
        if (diff.path.length == 2) {
          const toast = this.createToast(
            diff.rhs,
            this.entity.widgets[widgetId],
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
        if (diff.path.length == 2) {
          const toast = this.createToast(
            diff.lhs,
            this.entity.widgets[widgetId],
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
        if (isPositionUpdate(diff.path[diff.path.length - 2])) {
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
    diffWidget: any,
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
