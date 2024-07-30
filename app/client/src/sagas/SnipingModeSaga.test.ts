import type { ModuleInstance } from "@appsmith/constants/ModuleInstanceConstants";
import { keyBy } from "lodash";
import { testStore } from "store";
import { PostgresFactory } from "test/factories/Actions/Postgres";
import type { Saga } from "redux-saga";
import { runSaga } from "redux-saga";
import { bindDataToWidgetSaga } from "./SnipingModeSagas";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { getModuleInstanceById } from "@appsmith/selectors/moduleInstanceSelectors";
import WidgetFactory from "WidgetProvider/factory";
import TableWidget from "widgets/TableWidget/widget";
import { InputFactory } from "test/factories/Widgets/InputFactory";

jest.mock("@appsmith/selectors/moduleInstanceSelectors", () => ({
  ...jest.requireActual("@appsmith/selectors/moduleInstanceSelectors"),
  getModuleInstanceById: jest.fn(),
}));

describe("SnipingModeSaga", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("should check for moduleInstance and use when action is missing", async () => {
    const widget = InputFactory.build();
    const action = PostgresFactory.build();
    const moduleInstance = {
      id: "module-instance-id",
      name: "ModuleInstance1",
    } as ModuleInstance;

    (getModuleInstanceById as jest.Mock).mockReturnValue(moduleInstance);
    const spy = jest
      .spyOn(WidgetFactory, "getWidgetMethods")
      .mockImplementation(TableWidget.getMethods);

    const store = testStore({
      entities: {
        ...({} as any),
        actions: [
          {
            config: action,
          },
        ],
        canvasWidgets: keyBy([widget], "widgetId"),
      },
      ui: {
        ...({} as any),
        editor: {
          snipModeBindTo: "module-instance-id",
        },
      },
    });
    const dispatched: any[] = [];

    await runSaga(
      {
        dispatch: (action) => dispatched.push(action),
        getState: () => store.getState(),
      },
      bindDataToWidgetSaga as Saga,
      { payload: { widgetId: widget.widgetId, bindingQuery: "data" } },
    ).toPromise();

    expect(dispatched).toEqual([
      {
        payload: {
          updates: [
            {
              isDynamic: true,
              propertyPath: "tableData",
              skipValidation: true,
            },
          ],
          widgetId: widget.widgetId,
        },
        type: ReduxActionTypes.BATCH_SET_WIDGET_DYNAMIC_PROPERTY,
      },
      {
        payload: {
          shouldReplay: true,
          updates: { modify: { tableData: `{{${moduleInstance.name}.data}}` } },
          widgetId: widget.widgetId,
        },
        type: ReduxActionTypes.BATCH_UPDATE_WIDGET_PROPERTY,
      },
      {
        payload: { bindTo: undefined, isActive: false },
        type: ReduxActionTypes.SET_SNIPING_MODE,
      },
      {
        payload: {
          invokedBy: undefined,
          pageId: undefined,
          payload: [widget.widgetId],
          selectionRequestType: "One",
        },
        type: ReduxActionTypes.SELECT_WIDGET_INIT,
      },
    ]);

    spy.mockRestore();
  });
});
