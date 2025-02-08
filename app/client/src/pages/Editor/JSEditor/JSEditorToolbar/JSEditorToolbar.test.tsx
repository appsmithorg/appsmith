import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "test/testUtils";
import { JSEditorToolbar } from "./JSEditorToolbar";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { JSObjectFactory } from "test/factories/Actions/JSObject";

jest.mock("utils/hooks/useFeatureFlag");

const mockUseFeatureFlag = useFeatureFlag as jest.Mock;

const JSObject = JSObjectFactory.build();

const defaultProps = {
  changePermitted: true,
  hideEditIconOnEditor: false,
  saveJSObjectName: jest.fn(),
  hideContextMenuOnEditor: false,
  contextMenu: <div>ContextMenu</div>,
  disableRunFunctionality: false,
  executePermitted: true,
  loading: false,
  jsCollection: JSObject,
  onButtonClick: jest.fn(),
  onSelect: jest.fn(),
  jsActions: JSObject.actions,
  selected: {
    label: "JSObject1.myFun1",
    value: "myFunc1_id",
    data: JSObject.actions[0],
  },
  onUpdateSettings: jest.fn(),
  showSettings: true,
};

describe("JSEditorToolbar", () => {
  it("renders IDEToolbar with JSFunctionRun and JSFunctionSettings", () => {
    mockUseFeatureFlag.mockReturnValue(true);
    render(<JSEditorToolbar {...defaultProps} />);

    // Assert the Function select is a popup menu
    expect(screen.getByText("JSObject1.myFun1")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "JSObject1.myFun1" }),
    ).toHaveAttribute("aria-haspopup", "menu");

    // Assert the Run button is rendered
    expect(screen.getByRole("button", { name: "Run" })).toBeInTheDocument();

    // Assert the settings button is present
    expect(screen.getByTestId("t--js-settings-trigger")).toHaveAttribute(
      "aria-haspopup",
      "dialog",
    );

    // Assert that the context menu is present
    expect(screen.getByText("ContextMenu")).toBeInTheDocument();
  });

  it("does not render JSFunctionSettings when showSettings is false", () => {
    mockUseFeatureFlag.mockReturnValue(true);
    // Props can control the settings button visibility
    render(<JSEditorToolbar {...defaultProps} showSettings={false} />);
    expect(
      screen.queryByTestId("t--js-settings-trigger"),
    ).not.toBeInTheDocument();
  });

  it("does not render context menu when hideContextMenuOnEditor is true", () => {
    mockUseFeatureFlag.mockReturnValue(true);
    // Props can control the context menu visibility
    render(<JSEditorToolbar {...defaultProps} hideContextMenuOnEditor />);
    expect(screen.queryByText("ContextMenu")).not.toBeInTheDocument();
  });

  it("disables JSFunctionRun when disableRunFunctionality is true", () => {
    mockUseFeatureFlag.mockReturnValue(true);
    // Props can control the run button's disabled state
    render(<JSEditorToolbar {...defaultProps} disableRunFunctionality />);
    expect(screen.getByRole("button", { name: "Run" })).toHaveAttribute(
      "disabled",
    );
  });

  it("disables JSFunctionRun when executePermitted is false", () => {
    mockUseFeatureFlag.mockReturnValue(true);
    render(<JSEditorToolbar {...defaultProps} executePermitted={false} />);
    expect(screen.getByRole("button", { name: "Run" })).toHaveAttribute(
      "disabled",
    );
  });

  it("calls onButtonClick when JSFunctionRun button is clicked", () => {
    mockUseFeatureFlag.mockReturnValue(true);
    render(<JSEditorToolbar {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: "Run" }));
    expect(defaultProps.onButtonClick).toHaveBeenCalled();
  });
});
