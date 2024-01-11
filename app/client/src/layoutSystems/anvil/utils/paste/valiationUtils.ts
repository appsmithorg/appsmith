import { PASTE_FAILED, createMessage } from "@appsmith/constants/messages";
import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import { toast } from "design-system";
import type { CopiedWidgetData } from "./types";
import { areWidgetsWhitelisted } from "../layouts/whitelistUtils";
import { getParentLayout, getWidgetHierarchy } from "./utils";
import { widgetHierarchy } from "../constants";

function showErrorToast(message: string): void {
  toast.show(createMessage(PASTE_FAILED, message), {
    kind: "error",
  });
}

export function prePasteValidations(
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
      showErrorToast(
        `Maximum child limit (${maxChildLimit}) exceeded for this widget.`,
      );
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
