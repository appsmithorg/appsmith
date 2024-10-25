import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "test/testUtils";
import { JSFunctionSettings } from "./JSFunctionSettings";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { JSObjectFactory } from "test/factories/Actions/JSObject";

// Mock the useFeatureFlag hook
jest.mock("utils/hooks/useFeatureFlag");
const mockUseFeatureFlag = useFeatureFlag as jest.Mock;

const JSObject = JSObjectFactory.build();

const actions = JSObject.actions;

describe("JSFunctionSettings", () => {
  const onUpdateSettings = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("disables the switch when the component is disabled", () => {
    mockUseFeatureFlag.mockReturnValue(true);

    render(
      <JSFunctionSettings
        actions={actions}
        disabled
        onUpdateSettings={onUpdateSettings}
      />,
    );

    expect(screen.getByLabelText(actions[0].name)).toBeDisabled();
  });

  it("renders the correct number of switches for the actions", () => {
    mockUseFeatureFlag.mockReturnValue(true);

    render(
      <JSFunctionSettings
        actions={actions}
        disabled={false}
        onUpdateSettings={onUpdateSettings}
      />,
    );

    expect(screen.getAllByRole("switch")).toHaveLength(actions.length);
  });

  it("renders the switch state correctly", () => {
    mockUseFeatureFlag.mockReturnValue(true);

    const updatedJSActions = [
      {
        ...actions[0],
        executeOnLoad: true,
      },
      {
        ...actions[1],
        executeOnLoad: false,
      },
    ];

    render(
      <JSFunctionSettings
        actions={updatedJSActions}
        disabled={false}
        onUpdateSettings={onUpdateSettings}
      />,
    );

    const switchElement1 = screen.getByLabelText(updatedJSActions[0].name);
    const switchElement2 = screen.getByLabelText(updatedJSActions[1].name);

    expect(switchElement1).toBeChecked();
    expect(switchElement2).not.toBeChecked();
  });
});
