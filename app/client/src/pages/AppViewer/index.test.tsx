import React from "react";
import { Provider } from "react-redux";
import { render } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";

import store from "store";
import AppViewer from ".";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";

const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: () => mockDispatch,
}));

describe("AppViewer", () => {
  it("dispatches resets editor on unmount", () => {
    const { unmount } = render(
      <Provider store={store}>
        <Router>
          <AppViewer />
        </Router>
      </Provider>,
    );

    expect(mockDispatch).not.toBeCalledWith({
      type: ReduxActionTypes.RESET_EDITOR_REQUEST,
    });

    unmount();

    expect(mockDispatch).lastCalledWith({
      type: ReduxActionTypes.RESET_EDITOR_REQUEST,
    });
  });
});
