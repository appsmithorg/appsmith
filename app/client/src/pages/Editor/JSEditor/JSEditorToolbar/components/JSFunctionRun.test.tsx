import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "test/testUtils";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { JSObjectFactory } from "test/factories/Actions/JSObject";

import { convertJSActionsToDropdownOptions } from "../utils";
import { JSFunctionRun } from "./JSFunctionRun";
import { JS_FUNCTION_RUN_NAME_LENGTH } from "./constants";

jest.mock("utils/hooks/useFeatureFlag");
const mockUseFeatureFlag = useFeatureFlag as jest.Mock;

const JSObject = JSObjectFactory.build();

const mockProps = {
  disabled: false,
  isLoading: false,
  jsCollection: JSObject,
  onButtonClick: jest.fn(),
  onSelect: jest.fn(),
  options: convertJSActionsToDropdownOptions(JSObject.actions),
  selected: {
    label: JSObject.actions[0].name,
    value: JSObject.actions[0].name,
    data: JSObject.actions[0],
  },
  showTooltip: false,
};

describe("JSFunctionRun", () => {
  it("renders OldJSFunctionRun when feature flag is disabled", () => {
    mockUseFeatureFlag.mockReturnValue(false);
    render(<JSFunctionRun {...mockProps} />);
    expect(screen.getByText("myFun1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run" })).toBeInTheDocument();
  });

  it("renders new JSFunctionRun when feature flag is enabled", () => {
    mockUseFeatureFlag.mockReturnValue(true);
    render(<JSFunctionRun {...mockProps} />);
    // Assert the Function select is a popup menu
    expect(screen.getByText("myFun1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "myFun1" })).toHaveAttribute(
      "aria-haspopup",
      "menu",
    );
  });

  // This test is skipped because menu does not open in the test environment
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip("calls onSelect when a menu item is selected", () => {
    mockUseFeatureFlag.mockReturnValue(true);
    render(<JSFunctionRun {...mockProps} />);
    // click the button to open the menu
    fireEvent.click(screen.getByRole("button", { name: "myFun1" }));

    fireEvent.click(screen.getByText("myFun2"));
    expect(mockProps.onSelect).toHaveBeenCalledWith("myFun2");
  });

  it("disables the button when props.disabled is true", () => {
    mockUseFeatureFlag.mockReturnValue(true);
    render(<JSFunctionRun {...mockProps} disabled />);
    expect(screen.getByRole("button", { name: "myFun1" })).toBeDisabled();
  });

  // This test is skipped because tooltip does not show in the test environment
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip("shows tooltip when showTooltip is true", () => {
    mockUseFeatureFlag.mockReturnValue(true);
    render(<JSFunctionRun {...mockProps} showTooltip />);
    fireEvent.mouseOver(screen.getByText("Run"));
    expect(
      screen.getByText("No JS function to run in TestCollection"),
    ).toBeInTheDocument();
  });

  it("calls onButtonClick when run button is clicked", () => {
    mockUseFeatureFlag.mockReturnValue(true);
    render(<JSFunctionRun {...mockProps} />);
    fireEvent.click(screen.getByText("Run"));
    expect(mockProps.onButtonClick).toHaveBeenCalled();
  });

  it("truncates long names to 30 characters", () => {
    mockUseFeatureFlag.mockReturnValue(true);
    const options = [
      {
        label:
          "aReallyReallyLongFunctionNameThatConveysALotOfMeaningAndCannotBeShortenedAtAllBecauseItConveysALotOfMeaningAndCannotBeShortened",
        value: "1",
      },
    ];
    const [selected] = options;
    const jsCollection = { name: "CollectionName" };
    const params = { options, selected, jsCollection } as Parameters<
      typeof JSFunctionRun
    >[0];

    render(<JSFunctionRun {...params} />);

    expect(screen.getByTestId("t--js-function-run").textContent?.length).toBe(
      JS_FUNCTION_RUN_NAME_LENGTH,
    );
  });
});
