import React from "react";

import { act, renderHook } from "@testing-library/react-hooks";
import { Provider, useSelector } from "react-redux";
import { useAutoHeightUIState } from "utils/hooks/autoHeightUIHooks";

import store from "../store";
import { shouldWidgetIgnoreClicksSelector } from "./widgetSelectors";

describe("shouldWidgetIgnoreClicksSelector", () => {
  it("should return true when we are changing the auto height with limits", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );
    const { result: shouldIgnore } = renderHook(
      () => useSelector(shouldWidgetIgnoreClicksSelector("0")),
      { wrapper },
    );
    const { result: autoHeightUIState } = renderHook(
      () => useAutoHeightUIState(),
      { wrapper },
    );
    act(() => {
      autoHeightUIState.current.setIsAutoHeightWithLimitsChanging(true);
    });

    expect(shouldIgnore.current).toBe(true);
  });
});
