import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { keyBy } from "lodash";
import { runSaga } from "redux-saga";
import store, { testStore } from "store";
import { ListV2Factory } from "test/factories/Widgets/ListV2Factory";
import { deleteSaga } from "./WidgetDeletionSagas";

test("deleteSaga should dispatch DELETE_META_WIDGETS when widget has meta widgets", async () => {
  const listWidget = ListV2Factory.build();
  const defaultState = store.getState();
  const mockStore = testStore({
    ...defaultState,
    entities: {
      ...defaultState.entities,
      canvasWidgets: keyBy([listWidget], "widgetId"),
    },
    ui: {
      ...defaultState.ui,
      widgetDragResize: {
        ...defaultState.ui.widgetDragResize,
        lastSelectedWidget: listWidget.widgetId,
      },
    },
  });
  const dispatched: unknown[] = [];

  const deleteAction = {
    type: "DELETE_WIDGET",
    payload: {
      widgetId: undefined,
      parentId: undefined,
      disallowUndo: false,
      isShortcut: false,
    },
  };

  await runSaga(
    {
      dispatch: (action) => dispatched.push(action),
      getState: () => mockStore.getState(),
    },
    deleteSaga,
    deleteAction,
  ).toPromise();

  expect(dispatched).toContainEqual({
    type: ReduxActionTypes.DELETE_META_WIDGETS,
    payload: {
      creatorIds: [listWidget.widgetId],
    },
  });
});
