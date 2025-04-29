import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "test/testUtils";
import { JSFunctionSettings } from "./JSFunctionSettings";
import { JSObjectFactory } from "test/factories/Actions/JSObject";
import { ActionRunBehaviour } from "PluginActionEditor/constants/PluginActionConstants";

const JSObject = JSObjectFactory.build();

const actions = JSObject.actions;

describe("JSFunctionSettings", () => {
  const onUpdateSettings = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("disables the run behavior when the component is disabled", () => {
    render(
      <JSFunctionSettings
        actions={actions}
        disabled
        onUpdateSettings={onUpdateSettings}
      />,
    );

    expect(screen.getByLabelText(actions[0].name)).toBeDisabled();
  });

  it("renders the correct number of dropdowns for the actions", () => {
    render(
      <JSFunctionSettings
        actions={actions}
        disabled={false}
        onUpdateSettings={onUpdateSettings}
      />,
    );

    expect(screen.getAllByTestId(`execute-run-behavior`)).toHaveLength(
      actions.length,
    );
  });

  it("renders the run behavior correctly", () => {
    const updatedJSActions = [
      {
        ...actions[0],
        runBehavior: ActionRunBehaviour.ON_PAGE_LOAD,
      },
      {
        ...actions[1],
        runBehavior: ActionRunBehaviour.MANUAL,
      },
    ];

    render(
      <JSFunctionSettings
        actions={updatedJSActions}
        disabled={false}
        onUpdateSettings={onUpdateSettings}
      />,
    );

    const selectedItem1 = screen.getByText("On page load", {
      selector: ".myFun1-run-behavior-setting .rc-select-selection-item",
    });
    const selectedItem2 = screen.getByText("Manual", {
      selector: ".myFun2-run-behavior-setting .rc-select-selection-item",
    });

    expect(selectedItem1).toBeInTheDocument();
    expect(selectedItem2).toBeInTheDocument();
  });
});
