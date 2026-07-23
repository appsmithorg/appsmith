import { call } from "redux-saga/effects";

import { loadAndRegisterOnlyCanvasWidgets } from "sagas/EvaluationsSaga";
import { dynamicallyUpdateContainersSaga } from "./containers";
import { updateWidgetAutoHeightSaga } from "./widgets";

/**
 * In the published app widgets are registered lazily, so any auto-height
 * computation that runs before registration would read a 0 canvas-height
 * offset for unregistered container widgets (Card, Tabs, etc.) and shrink
 * them to their bare canvas height. These tests pin the ordering guarantee
 * that both sagas ensure registration before any computation.
 */
describe("auto-height sagas widget-registration guard", () => {
  it("dynamicallyUpdateContainersSaga registers used widgets before computing", () => {
    const gen = dynamicallyUpdateContainersSaga();

    expect(gen.next().value).toEqual(call(loadAndRegisterOnlyCanvasWidgets));
  });

  it("updateWidgetAutoHeightSaga registers used widgets before computing", () => {
    const gen = updateWidgetAutoHeightSaga();

    expect(gen.next().value).toEqual(call(loadAndRegisterOnlyCanvasWidgets));
  });
});
