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

  /**
   * loadAndRegisterOnlyCanvasWidgets rethrows — an unknown widget type in the
   * DSL, or a chunk fetch that fails mid rolling-upgrade. These sagas are bound
   * to takeEvery/debounce on hot auto-height actions, so an uncaught error
   * would restart-loop the watcher and drop every height update. Registration
   * failure must degrade to the previous behaviour, not abort the computation.
   */
  it.each([
    ["dynamicallyUpdateContainersSaga", dynamicallyUpdateContainersSaga],
    ["updateWidgetAutoHeightSaga", updateWidgetAutoHeightSaga],
  ])("%s continues when registration fails", (_label, saga) => {
    const gen = saga();

    expect(gen.next().value).toEqual(call(loadAndRegisterOnlyCanvasWidgets));

    // Reject the registration effect: the saga must swallow it and proceed to
    // its next effect rather than propagating the error to its watcher.
    let resumed: IteratorResult<unknown> | undefined;

    expect(() => {
      resumed = gen.throw(new Error("Widget type CARD_WIDGET not found"));
    }).not.toThrow();

    expect(resumed?.done).toBe(false);
    expect(resumed?.value).toBeDefined();
  });
});
