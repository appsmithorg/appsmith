import { select } from "redux-saga/effects";
import { addWidgetsSaga } from ".";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { generateReactKey } from "@shared/dsl/src/migrate/utils";
import { LayoutComponentTypes } from "layoutSystems/anvil/utils/anvilTypes";
import { expectSaga } from "redux-saga-test-plan";
import { getWidgets } from "sagas/selectors";
import { registerWidgets } from "WidgetProvider/factory/registrationHelper";
import { SectionWidget } from "widgets/anvil/SectionWidget";
import { ZoneWidget } from "widgets/anvil/ZoneWidget";
import { WDSButtonWidget } from "widgets/wds/WDSButtonWidget";
import {
  getCanvasWidth,
  getIsAutoLayoutMobileBreakPoint,
} from "selectors/editorSelectors";
import { getCurrentlyOpenAnvilDetachedWidgets } from "../../modalSelectors";
import { getDataTree } from "selectors/dataTreeSelectors";
import { getLayoutSystemType } from "selectors/layoutSystemSelectors";
import { registerLayoutComponents } from "layoutSystems/anvil/utils/layouts/layoutUtils";
import { getIsAnvilLayout } from "../../selectors";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { WDSModalWidget } from "widgets/wds/WDSModalWidget";

describe("", () => {
  beforeAll(() => {
    registerLayoutComponents();
    registerWidgets([
      SectionWidget,
      ZoneWidget,
      WDSButtonWidget,
      WDSModalWidget,
    ]);
  });
  // Successfully adds a new widget to the main canvas
  it("should successfully add a new widget to the main canvas", async () => {
    const mainCanvasLayoutId = generateReactKey();
    const newWidgetId = generateReactKey();
    const allWidgets: any = {
      [MAIN_CONTAINER_WIDGET_ID]: {
        widgetName: "Main Container",
        widgetId: MAIN_CONTAINER_WIDGET_ID,
        children: [],
        layout: [
          {
            layoutId: mainCanvasLayoutId,
            layoutType: LayoutComponentTypes.ALIGNED_LAYOUT_COLUMN,
            layout: [],
          },
        ],
      },
    };
    const actionPayload: any = {
      type: "ADD_NEW_WIDGET",
      payload: {
        dragMeta: { draggedOn: "MAIN_CANVAS", draggedWidgetTypes: "WIDGETS" },
        highlight: {
          alignment: "start",
          canvasId: MAIN_CONTAINER_WIDGET_ID,
          layoutId: mainCanvasLayoutId,
          layoutOrder: [mainCanvasLayoutId],
        },
        newWidget: {
          width: 100,
          height: 50,
          newWidgetId,
          type: "WDS_BUTTON_WIDGET",
          detachFromLayout: false,
          parentId: MAIN_CONTAINER_WIDGET_ID,
        },
      },
    };
    const { effects } = await expectSaga(addWidgetsSaga, actionPayload)
      .provide([
        [select(getWidgets), allWidgets],
        [select(getCanvasWidth), 100],
        [select(getIsAutoLayoutMobileBreakPoint), false],
        [select(getCurrentlyOpenAnvilDetachedWidgets), []],
        [select(getDataTree), {}],
        [select(getLayoutSystemType), "ANVIL"],
        [select(getIsAnvilLayout), true],
      ])
      .run();
    const widgetSelectPutEffect = effects.put[effects.put.length - 1];
    expect(widgetSelectPutEffect.payload.action).toEqual(
      selectWidgetInitAction(SelectionRequestType.Create, [newWidgetId]),
    );
    const updateWidgetsPutEffect = effects.put[effects.put.length - 2];
    expect(updateWidgetsPutEffect.payload.action.type).toBe("UPDATE_LAYOUT");
    // check if new widget was added to main canvas by wrapping it in a section and zone
    const updatedWidgets =
      updateWidgetsPutEffect.payload.action.payload.widgets;
    const mainCanvasWidget = updatedWidgets[MAIN_CONTAINER_WIDGET_ID];
    const sectionWidgetId = mainCanvasWidget.children[0];
    const sectionWidget = updatedWidgets[sectionWidgetId];
    const zoneWidgetId = sectionWidget.children[0];
    const zoneWidget = updatedWidgets[zoneWidgetId];
    expect(zoneWidget.children).toContain(newWidgetId);
  });
  it("should successfully add a new modal widget to the main canvas", async () => {
    const mainCanvasLayoutId = generateReactKey();
    const newModalId = generateReactKey();
    const allWidgets: any = {
      [MAIN_CONTAINER_WIDGET_ID]: {
        widgetName: "Main Container",
        widgetId: MAIN_CONTAINER_WIDGET_ID,
        children: [],
        layout: [
          {
            layoutId: mainCanvasLayoutId,
            layoutType: LayoutComponentTypes.ALIGNED_LAYOUT_COLUMN,
            layout: [],
          },
        ],
      },
    };
    const actionPayload: any = {
      type: "ADD_NEW_WIDGET",
      payload: {
        dragMeta: { draggedOn: "MAIN_CANVAS", draggedWidgetTypes: "WIDGETS" },
        highlight: {
          alignment: "start",
          canvasId: MAIN_CONTAINER_WIDGET_ID,
          layoutId: mainCanvasLayoutId,
          layoutOrder: [mainCanvasLayoutId],
        },
        newWidget: {
          width: 100,
          height: 50,
          newWidgetId: newModalId,
          type: "WDS_MODAL_WIDGET",
          detachFromLayout: true,
          parentId: MAIN_CONTAINER_WIDGET_ID,
        },
      },
    };
    const { effects } = await expectSaga(addWidgetsSaga, actionPayload)
      .provide([
        [select(getWidgets), allWidgets],
        [select(getCanvasWidth), 100],
        [select(getIsAutoLayoutMobileBreakPoint), false],
        [select(getCurrentlyOpenAnvilDetachedWidgets), []],
        [select(getDataTree), {}],
        [select(getLayoutSystemType), "ANVIL"],
        [select(getIsAnvilLayout), true],
      ])
      .run();
    const widgetSelectPutEffect = effects.put[effects.put.length - 1];
    expect(widgetSelectPutEffect.payload.action).toEqual(
      selectWidgetInitAction(SelectionRequestType.Create, [newModalId]),
    );
    const updateWidgetsPutEffect = effects.put[effects.put.length - 2];
    expect(updateWidgetsPutEffect.payload.action.type).toBe("UPDATE_LAYOUT");
    // check if new widget was added to main canvas by wrapping it in a section and zone
    const updatedWidgets =
      updateWidgetsPutEffect.payload.action.payload.widgets;
    const mainCanvasWidget = updatedWidgets[MAIN_CONTAINER_WIDGET_ID];
    const modalWidgetId = mainCanvasWidget.children[0];
    expect(modalWidgetId).toContain(newModalId);
  });
});
