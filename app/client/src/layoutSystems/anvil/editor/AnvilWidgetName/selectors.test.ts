import { getWidgetErrorCount } from "./selectors";
import { RenderModes } from "constants/WidgetConstants";
import { EVAL_ERROR_PATH } from "utils/DynamicBindingUtils";
import set from "lodash/set";

const extraWidgetEntityProperties = {
  meta: {},
  type: "",
  widgetName: "Widget2",
  renderMode: RenderModes.CANVAS,
};
// Mock state
// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAppState: any = {
  evaluations: {
    tree: {
      // Sample widget entities for testing
      widget1: {
        ENTITY_TYPE: "WIDGET",
        widgetId: "widget1",
        ...extraWidgetEntityProperties,
      },
      widget2: {
        ENTITY_TYPE: "WIDGET",
        widgetId: "widget2",
        ...extraWidgetEntityProperties,
      },
      action3: {
        ENTITY_TYPE: "ACTION",
        actionId: "",
      },
    },
  },
};

describe("Anvil Selectors", () => {
  it("should return 0 when widgetId is not found", () => {
    const widgetId = "nonExistentWidget";
    const errorCount = getWidgetErrorCount(mockAppState, widgetId);

    expect(errorCount).toBe(0);
  });

  it("should return 0 when widget has no error path", () => {
    const widgetId = "widget1"; // Assuming widget1 has no errors
    const errorCount = getWidgetErrorCount(mockAppState, widgetId);

    expect(errorCount).toBe(0);
  });

  it("should return correct error count when widget has errors", () => {
    const widgetId = "widget2"; // Assuming widget2 has errors

    const mockStateWithErrors = set(
      mockAppState,
      `evaluations.tree.${widgetId}.${EVAL_ERROR_PATH}`,
      {
        isVisible: [1, 2, 3],
        label: ["error1", "error2"],
      },
    );

    const errorCount = getWidgetErrorCount(mockStateWithErrors, widgetId);

    expect(errorCount).toBe(5); // Total errors: 3 (numbers) + 2 (strings)
  });

  it("should handle empty state", () => {
    const widgetId = "widget1";
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const emptyState: any = { evaluations: { tree: {} } }; // Empty state
    const errorCount = getWidgetErrorCount(emptyState, widgetId);

    expect(errorCount).toBe(0);
  });

  it("should handle empty error object", () => {
    const widgetId = "widget1"; // Assuming widget1 has an empty error object
    const mockStateWithEmptyErrors = set(
      mockAppState,
      `evaluations.tree.${widgetId}.${EVAL_ERROR_PATH}`,
      {},
    );

    const errorCount = getWidgetErrorCount(mockStateWithEmptyErrors, widgetId);

    expect(errorCount).toBe(0);
  });
});
