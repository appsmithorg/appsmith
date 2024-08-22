import React from "react";

import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { lightTheme } from "selectors/themeSelectors";
import { testStore } from "store";
import { ThemeProvider } from "styled-components";

import { APPSMITH_GLOBAL_FUNCTIONS } from "../../constants";
import type { TActionBlock } from "../../types";
import ActionTree from "./ActionTree";

describe("tests for Action Tree in Action Selector", () => {
  const store = testStore({});
  it("callback button is rendered for chainable actions", function () {
    const actionBlock: TActionBlock = {
      code: "showAlert('Hello')",
      actionType: APPSMITH_GLOBAL_FUNCTIONS.showAlert,
      success: {
        blocks: [],
      },
      error: {
        blocks: [],
      },
    };
    const component = render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <ActionTree
            actionBlock={actionBlock}
            dataTreePath=""
            id="xyz"
            level={0}
            onChange={() => {
              return;
            }}
            propertyName=""
            widgetName=""
            widgetType=""
          />
        </ThemeProvider>
      </Provider>,
    );

    const callbackBtn = component.queryByTestId("t--callback-btn-xyz");
    expect(callbackBtn).not.toBeNull();
  });

  it("callback button should not be rendered for actions that are not chainable", function () {
    const actionBlock: TActionBlock = {
      code: "setInterval(() => showAlert('Hello'), 1000, 'test')",
      actionType: APPSMITH_GLOBAL_FUNCTIONS.setInterval,
      success: {
        blocks: [],
      },
      error: {
        blocks: [],
      },
    };
    const component = render(
      <Provider store={store}>
        <ThemeProvider theme={lightTheme}>
          <ActionTree
            actionBlock={actionBlock}
            dataTreePath=""
            id="xyz"
            level={0}
            onChange={() => {
              return;
            }}
            propertyName=""
            widgetName=""
            widgetType=""
          />
        </ThemeProvider>
      </Provider>,
    );

    const callbackBtn = component.queryByTestId("t--callback-btn-xyz");
    expect(callbackBtn).toBeNull();
  });
});
