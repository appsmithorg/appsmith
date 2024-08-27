import { generateAutoHeightLayoutTreeAction } from "actions/autoHeightActions";
import { closePropertyPane } from "actions/widgetActions";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";
import { getIsAnvilLayout } from "layoutSystems/anvil/integrations/selectors";
import { updateAndSaveAnvilLayout } from "layoutSystems/anvil/utils/anvilChecksUtils";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import {
  call,
  type CallEffect,
  put,
  type PutEffect,
  select,
  type SelectEffect,
} from "redux-saga/effects";
import { getLayoutSystemType } from "selectors/layoutSystemSelectors";
import FocusRetention from "./FocusRetentionSaga";
import { getSelectedWidget, getWidget } from "./selectors";
import {
  selectedWidget,
  stateWidget,
  updatedDSL,
} from "./WidgetDeleteSagaTestFixtures";
import {
  deleteSaga,
  getUpdatedDslAfterDeletingWidget,
  postDelete,
} from "./WidgetDeletionSagas";
import { SelectionRequestType } from "./WidgetSelectUtils";

type GeneratorType = Generator<
  SelectEffect | CallEffect | PutEffect,
  boolean | undefined,
  unknown
>;

describe("WidgetDeletionSaga", () => {
  it("should delete a widget and remove its meta widgets", () => {
    let result;
    const generator: GeneratorType = deleteSaga({
      type: ReduxActionTypes.WIDGET_DELETE,
      payload: {
        widgetId: undefined,
        parentId: undefined,
        disallowUndo: false,
      },
    });

    // Step 1: Check if widgetId is not provided, select the currently selected widget
    result = generator.next();
    expect(result.value).toEqual(select(getSelectedWidget));

    // Step 2: Mock the return value of getSelectedWidget to Widget
    result = generator.next(selectedWidget);
    expect(result.value).toEqual(select(getWidget, selectedWidget.widgetId));

    // Step 3: Mock the return value of getWidget to stateWidget
    result = generator.next(stateWidget);
    expect(result.value).toEqual(
      call(
        getUpdatedDslAfterDeletingWidget,
        selectedWidget.widgetId,
        selectedWidget.parentId,
      ),
    );

    // Step 4: Mock the return value of getUpdatedDslAfterDeletingWidget to updatedDSL
    result = generator.next(updatedDSL);

    // Step 5: Check if the widget has meta widgets, true dispatch DELETE_META_WIDGETS action
    if (stateWidget.hasMetaWidgets) {
      expect(result.value).toEqual({
        "@@redux-saga/IO": true,
        combinator: false,
        type: "PUT",
        payload: {
          channel: undefined,
          action: {
            type: ReduxActionTypes.DELETE_META_WIDGETS,
            payload: {
              creatorIds: [selectedWidget.widgetId],
            },
          },
        },
      });

      result = generator.next();
    }

    // Step 6: Select the layout system type
    expect(result.value).toEqual(select(getLayoutSystemType));
    result = generator.next();

    // Step 7: if the layout system is Anvil
    expect(result.value).toEqual(select(getIsAnvilLayout));
    result = generator.next();

    // Step 8: Call updateSaveAnvilLayout with the final widgets
    expect(result.value).toEqual(
      call(
        updateAndSaveAnvilLayout,
        updatedDSL?.finalWidgets as CanvasWidgetsReduxState,
      ),
    );

    // Step 9: Dispatch generateAutoHeightLayoutTreeAction to update the layout
    result = generator.next();
    expect(result.value).toEqual(
      put(generateAutoHeightLayoutTreeAction(true, true)),
    );

    // Step 10: Select the current application
    result = generator.next();
    expect(result.value).toEqual(select(getCurrentApplication));

    // Step 11: Call FocusRetention.handleRemoveFocusHistory with the current URL
    const currentUrl = "/";
    result = generator.next();
    expect(result.value).toEqual(
      call(FocusRetention.handleRemoveFocusHistory, currentUrl),
    );

    // Step12: Dispatch closePropertyPane to close the property pane
    result = generator.next();
    expect(result.value).toEqual(put(closePropertyPane()));

    // Step 13: Dispatch selectWidgetInitAction to unselect the widget
    result = generator.next();
    expect(result.value).toEqual(
      put(
        selectWidgetInitAction(SelectionRequestType.Unselect, [
          selectedWidget.widgetId,
        ]),
      ),
    );

    // 14: postDelete to handle post-deletion tasks
    result = generator.next();
    expect(result.value).toEqual(
      call(
        postDelete,
        selectedWidget.widgetId,
        stateWidget.widgetName,
        updatedDSL!.otherWidgetsToDelete,
      ),
    );

    // Step 15: Check if the generator is done
    result = generator.next();
    expect(result.done).toBe(true);
  });
});
