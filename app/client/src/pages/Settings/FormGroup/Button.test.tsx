import { render, screen } from "test/testUtils";
import React from "react";
import { SettingTypes } from "@appsmith/pages/AdminSettings/config/types";
import ButtonComponent from "./Button";

let container: any = null;
const buttonClickHandler = jest.fn();
const buttonIsDisabled = jest.fn();
const setting = {
  id: "SETTING_ID",
  text: "download",
  action: buttonClickHandler,
  category: "test",
  controlType: SettingTypes.BUTTON,
  isDisabled: buttonIsDisabled,
};
const dispatch = jest.fn();
jest.mock("react-redux", () => {
  const originalModule = jest.requireActual("react-redux");
  return {
    ...originalModule,
    useDispatch: () => dispatch,
  };
});

const settings = {};
jest.mock("store", () => {
  const store = jest.requireActual("store").default;
  return {
    ...store,
    useSelector: () => settings,
  };
});

function renderComponent() {
  render(<ButtonComponent setting={setting} />, container);
}

describe("Button", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("is rendered", () => {
    renderComponent();
    const button = screen.queryAllByTestId("admin-settings-button");
    expect(button).toHaveLength(1);
  });

  it("is rendered with proper text", () => {
    renderComponent();
    const button = screen.queryAllByTestId("admin-settings-button");
    expect(button).toHaveLength(1);
    expect(button[0].textContent).toBe(setting.text);
  });

  it("is disabled when isDisabled is returning true", () => {
    buttonIsDisabled.mockReturnValue(true);
    renderComponent();
    const button = screen.queryAllByTestId("admin-settings-button");
    expect(buttonIsDisabled).toHaveBeenCalledWith(settings);
    expect((button[0] as any).disabled).toBeTruthy();
  });

  it("is not disabled when isDisabled is returning false", () => {
    buttonIsDisabled.mockReturnValue(false);
    renderComponent();
    const button = screen.queryAllByTestId("admin-settings-button");
    expect(buttonIsDisabled).toHaveBeenCalledWith(settings);
    expect((button[0] as any).disabled).toBeFalsy();
  });

  it("is executing action of setting on click", () => {
    renderComponent();
    const button = screen.queryAllByTestId("admin-settings-button");
    expect(buttonClickHandler).not.toHaveBeenCalled();
    button[0].click();
    expect(buttonClickHandler).toHaveBeenCalledWith(dispatch, settings);
  });
});
