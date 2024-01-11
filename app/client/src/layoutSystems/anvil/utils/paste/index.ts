import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { call, put, select } from "redux-saga/effects";
import { getSelectedWidgetWhenPasting } from "sagas/WidgetOperationUtils";
import { getWidgets } from "sagas/selectors";
import { updateAndSaveAnvilLayout } from "../anvilChecksUtils";
import { builderURL } from "@appsmith/RouteBuilder";
import { getCurrentPageId } from "selectors/editorSelectors";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import history from "utils/history";
import { PASTE_FAILED, createMessage } from "@appsmith/constants/messages";
import { toast } from "design-system";
import { areWidgetsWhitelisted } from "../layouts/whitelistUtils";
import type { CopiedWidgetData } from "./types";
import {
  getParentLayout,
  getWidgetHierarchy,
  splitWidgetsByHierarchy,
} from "./utils";
import { pasteMigrantWidgets } from "./migrantUtils";
import { pasteResidentWidgets } from "./residentUtils";
import { widgetHierarchy } from "../constants";

export function* pasteSagas(copiedWidgets: CopiedWidgetData[]) {
  const originalWidgets: CopiedWidgetData[] = [...copiedWidgets];

  if (!originalWidgets.length) return;

  const selectedWidget: FlattenedWidgetProps =
    yield getSelectedWidgetWhenPasting();

  let allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);

  /**
   * Order widgets based on hierarchy.
   * MainCanvas > Section > Zone > Others.
   */
  const order: CopiedWidgetData[][] = splitWidgetsByHierarchy(copiedWidgets);

  /**
   * Get new parentId to paste widgets into.
   */

  const newParentId: string | null = getNewParentId(
    allWidgets,
    selectedWidget,
    originalWidgets,
    order,
  );

  if (!newParentId) throw new Error("Invalid pasting parent");

  /**
   * Split copied widgets based on whether their parent has changed.
   */
  const {
    migrants,
    residents,
  }: { migrants: CopiedWidgetData[]; residents: CopiedWidgetData[] } =
    splitWidgetsOnResidenceStatus(originalWidgets, newParentId);

  /**
   * Track mapping between original and new widgetIds.
   */
  let widgetIdMap: Record<string, string> = {};
  let reverseWidgetIdMap: Record<string, string> = {};

  /**
   * For each resident, add them next to the original copied widget.
   */
  if (residents.length) {
    const res: {
      map: Record<string, string>;
      reverseMap: Record<string, string>;
      widgets: CanvasWidgetsReduxState;
    } = yield call(
      pasteResidentWidgets,
      allWidgets,
      widgetIdMap,
      reverseWidgetIdMap,
      residents,
      newParentId,
    );
    allWidgets = res.widgets;
    widgetIdMap = res.map;
    reverseWidgetIdMap = res.reverseMap;
  }

  /**
   * For each migrant, add them at the end of the new parent.
   * Order of migration should be maintained.
   */
  if (migrants.length) {
    /**
     * For each migrant,
     * 1. Create new widget.
     * 2. Update properties.
     * 3. Get original containing layouts.
     * 4. If newParent.childTemplate?.layoutType matches originalLayout.layoutType,
     *  4.1. true => Check if required layout already exists.
     *   a) true => add to the layout.
     *   b) false => add a new layout at the end of the parent.
     *  4.2. false => create new child template layout and add widget to it.
     *  4.3. newParent.childTemplate === null,
     *    => add all widgets to the end of the new parent.
     */

    const res: {
      map: Record<string, string>;
      reverseMap: Record<string, string>;
      widgets: CanvasWidgetsReduxState;
    } = yield call(
      pasteMigrantWidgets,
      allWidgets,
      widgetIdMap,
      reverseWidgetIdMap,
      newParentId,
      order,
    );
    allWidgets = res.widgets;
    widgetIdMap = res.map;
    reverseWidgetIdMap = res.reverseMap;
  }

  /**
   * Save state
   */
  yield call(updateAndSaveAnvilLayout, allWidgets);

  const pageId: string = yield select(getCurrentPageId);

  if (originalWidgets?.length) {
    history.push(builderURL({ pageId }));
  }

  yield put({
    type: ReduxActionTypes.RECORD_RECENTLY_ADDED_WIDGET,
    payload: Object.values(widgetIdMap),
  });

  yield put(
    selectWidgetInitAction(
      SelectionRequestType.Multiple,
      Object.values(widgetIdMap),
    ),
  );
}

export function getNewParentId(
  allWidgets: CanvasWidgetsReduxState,
  selectedWidget: FlattenedWidgetProps,
  copiedWidgets: CopiedWidgetData[],
  order: CopiedWidgetData[][],
): string | null {
  /**
   * Return selectedWidget if it is the MainCanvas.
   */
  if (selectedWidget.widgetId === MAIN_CONTAINER_WIDGET_ID)
    return selectedWidget.widgetId;

  /**
   * Return selectedWidget if it has a layout property.
   * => it is a container widget (Section / Zone / Modal).
   */
  if (!!selectedWidget.layout) {
    if (!prePasteValidations(selectedWidget, copiedWidgets, order)) return null;
    return selectedWidget.widgetId;
  } else {
    /**
     * Selected widget is a non-layout widget.
     *
     * If the widget doesn't have a valid parent, return null.
     */
    if (!selectedWidget.parentId || !allWidgets[selectedWidget.parentId])
      return null;
    /**
     * Recursively check if the parent is a valid layout widget.
     */
    const parentId: string | null = getNewParentId(
      allWidgets,
      allWidgets[selectedWidget.parentId],
      copiedWidgets,
      order,
    );
    return parentId;
  }
}

/**
 * Split copied widgets based on migration status.
 * migrants => parentId has changed.
 * residents => parentId has not changed.
 * @param copiedWidgets | CopiedWidgetData[] : list of copied widgets.
 * @param newParentId | string : new parent id to paste widgets into.
 */
function splitWidgetsOnResidenceStatus(
  copiedWidgets: CopiedWidgetData[],
  newParentId: string,
): { migrants: CopiedWidgetData[]; residents: CopiedWidgetData[] } {
  const migrants: CopiedWidgetData[] = [];
  const residents: CopiedWidgetData[] = [];

  copiedWidgets.forEach((copiedWidget: CopiedWidgetData) => {
    if (copiedWidget.parentId === newParentId) residents.push(copiedWidget);
    else migrants.push(copiedWidget);
  });

  return { migrants, residents };
}

function showErrorToast(message: string): void {
  toast.show(createMessage(PASTE_FAILED, message), {
    kind: "error",
  });
}

function prePasteValidations(
  parentWidget: FlattenedWidgetProps,
  copiedWidgets: CopiedWidgetData[],
  order: CopiedWidgetData[][],
): boolean {
  /**
   * Check copied widgets for presence of same layout widgets or presence of the parent widget itself.
   */
  let matchingParent = false,
    matchingType = false;
  const widgetTypes: string[] = copiedWidgets.map((data: CopiedWidgetData) => {
    const type = data.list[0].type;
    if (type === parentWidget.type) matchingType = true;
    if (data.widgetId === parentWidget.widgetId) matchingParent = true;
    return type;
  });
  if (matchingParent) {
    showErrorToast(
      `Cannot paste ${parentWidget.type} widgets into themselves.`,
    );
    return false;
  }
  if (matchingType) {
    showErrorToast(`Cannot nest ${parentWidget.type} widgets.`);
    return false;
  }
  /**
   * Check if all copied widgets are whitelisted by the new parent layout.
   */
  const parentLayout = getParentLayout(parentWidget);
  if (
    parentLayout?.allowedWidgetTypes &&
    !areWidgetsWhitelisted(widgetTypes, parentLayout?.allowedWidgetTypes)
  ) {
    showErrorToast("Some widgets are not allowed in this layout");
    return false;
  }

  /**
   * Check if maxChildLimit violation is encountered.
   */
  if (parentLayout) {
    const { layout, maxChildLimit } = parentLayout;
    if (
      maxChildLimit !== undefined &&
      layout.length + getCopiedWidgetCount(order, parentWidget) > maxChildLimit
    ) {
      showErrorToast("This widget can not hold as many children");
      return false;
    }
  }

  return true;
}

/**
 * Calculate the number of children that will be added.
 * => Count all the widgets in the immediately lower order of hierarchy.
 * => All other widgets in lower orders will account for a single entry.
 * @param order : CopiedWidgetData[][]
 * @param parentWidget : FlattenedWidgetProps
 * @returns : number
 */
function getCopiedWidgetCount(
  order: CopiedWidgetData[][],
  parentWidget: FlattenedWidgetProps,
): number {
  const parentHierarchy: number = getWidgetHierarchy(
    parentWidget.type,
    parentWidget.widgetId,
  );
  let count = order[parentHierarchy + 1].length;
  for (
    let i = parentHierarchy + 2;
    i < Object.keys(widgetHierarchy).length;
    i += 1
  ) {
    if (order[i].length) {
      count += 1;
      break;
    }
  }
  return count;
}
