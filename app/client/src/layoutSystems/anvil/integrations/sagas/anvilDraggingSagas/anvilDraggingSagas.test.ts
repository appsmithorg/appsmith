import { select } from "redux-saga/effects";
import { moveWidgetsSaga } from ".";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { generateReactKey } from "@shared/dsl/src/migrate/utils";
import { LayoutComponentTypes } from "layoutSystems/anvil/utils/anvilTypes";
import { expectSaga } from "redux-saga-test-plan";
import { getWidgets } from "sagas/selectors";
import { registerWidgets } from "WidgetProvider/factory/registrationHelper";
import { WDSSectionWidget } from "widgets/wds/WDSSectionWidget";
import { WDSZoneWidget } from "widgets/wds/WDSZoneWidget";
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
import { generateMockDataWithTwoSections } from "./mockData.helper";
import type { AnvilMoveWidgetsPayload } from "../../actions/actionTypes";
import {
  AnvilReduxActionTypes,
  type AnvilNewWidgetsPayload,
} from "../../actions/actionTypes";
import { AnvilDraggedWidgetTypesEnum } from "layoutSystems/anvil/editor/canvasArenas/types";
import {
  FlexLayerAlignment,
  ResponsiveBehavior,
} from "layoutSystems/common/utils/constants";
import { mockAnvilHighlightInfo } from "mocks/mockHighlightInfo";
import { addWidgetsSaga } from "../anvilWidgetAdditionSagas";

describe("", () => {
  beforeAll(() => {
    registerLayoutComponents();
    registerWidgets([
      WDSSectionWidget,
      WDSZoneWidget,
      WDSButtonWidget,
      WDSModalWidget,
    ]);
  });
  // Successfully adds a new widget to the main canvas
  it("should successfully add a new widget to the main canvas", async () => {
    const mainCanvasLayoutId = generateReactKey();
    const newWidgetId = generateReactKey();
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    const payload: AnvilNewWidgetsPayload = {
      dragMeta: {
        draggedOn: "MAIN_CANVAS",
        draggedWidgetTypes: AnvilDraggedWidgetTypesEnum.WIDGETS,
      },
      highlight: mockAnvilHighlightInfo({
        alignment: FlexLayerAlignment.Start,
        canvasId: MAIN_CONTAINER_WIDGET_ID,
        layoutId: mainCanvasLayoutId,
        layoutOrder: [mainCanvasLayoutId],
      }),
      newWidget: {
        width: 100,
        height: 50,
        newWidgetId,
        type: "WDS_BUTTON_WIDGET",
        detachFromLayout: false,
      },
    };
    const actionPayload = {
      type: AnvilReduxActionTypes.ANVIL_ADD_NEW_WIDGET,
      payload,
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    const payload: AnvilNewWidgetsPayload = {
      dragMeta: {
        draggedOn: "MAIN_CANVAS",
        draggedWidgetTypes: AnvilDraggedWidgetTypesEnum.WIDGETS,
      },
      highlight: mockAnvilHighlightInfo({
        alignment: FlexLayerAlignment.Start,
        canvasId: MAIN_CONTAINER_WIDGET_ID,
        layoutId: mainCanvasLayoutId,
        layoutOrder: [mainCanvasLayoutId],
      }),
      newWidget: {
        width: 100,
        height: 50,
        newWidgetId: newModalId,
        type: "WDS_MODAL_WIDGET",
        detachFromLayout: true,
      },
    };
    const actionPayload = {
      type: AnvilReduxActionTypes.ANVIL_ADD_NEW_WIDGET,
      payload,
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

  it("should successfully move widget to the main canvas", async () => {
    const { allWidgets, mainCanvasLayoutId, section1Id, section2Id } =
      generateMockDataWithTwoSections();
    const payload: AnvilMoveWidgetsPayload = {
      dragMeta: {
        draggedOn: "MAIN_CANVAS",
        draggedWidgetTypes: AnvilDraggedWidgetTypesEnum.SECTION,
      },
      movedWidgets: [
        {
          widgetId: section2Id,
          type: "SECTION_WIDGET",
          parentId: MAIN_CONTAINER_WIDGET_ID,
          responsiveBehavior: ResponsiveBehavior.Fill,
        },
      ],
      highlight: mockAnvilHighlightInfo({
        alignment: FlexLayerAlignment.Start,
        rowIndex: 0,
        canvasId: MAIN_CONTAINER_WIDGET_ID,
        layoutId: mainCanvasLayoutId,
        layoutOrder: [mainCanvasLayoutId],
      }),
    };
    const actionPayload = {
      type: AnvilReduxActionTypes.ANVIL_MOVE_WIDGET,
      payload,
    };
    const { effects } = await expectSaga(moveWidgetsSaga, actionPayload)
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
    const updateWidgetsPutEffect = effects.put[effects.put.length - 1];
    expect(updateWidgetsPutEffect.payload.action.type).toBe("UPDATE_LAYOUT");
    // expect section2 to be moved to the first position in layout
    const updatedWidgets =
      updateWidgetsPutEffect.payload.action.payload.widgets;
    const mainCanvasWidget = updatedWidgets[MAIN_CONTAINER_WIDGET_ID];
    const mainCanvasLayout = mainCanvasWidget.layout[0];
    const firstWidgetRow = mainCanvasLayout.layout[0];
    const secondWidgetRow = mainCanvasLayout.layout[1];
    expect(firstWidgetRow.layout[0].widgetId).toBe(section2Id);
    expect(secondWidgetRow.layout[0].widgetId).toBe(section1Id);
  });
});
