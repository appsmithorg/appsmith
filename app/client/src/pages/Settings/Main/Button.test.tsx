import { render, screen } from "test/testUtils";
import React from "react";
import { SettingTypes } from "../SettingsConfig";
import ButtonComponent from "./Button";

let container: any = null;
const buttonClickHandler = jest.fn();
const setting = {
  text: "download",
  action: buttonClickHandler,
  category: "test",
  controlType: SettingTypes.BUTTON,
};
const dispatch = jest.fn();
jest.mock("react-redux", () => {
  const originalModule = jest.requireActual("react-redux");
  return {
    ...originalModule,
    useDispatch: () => dispatch,
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

  it("is executing action of setting on click", () => {
    renderComponent();
    const button = screen.queryAllByTestId("admin-settings-button");
    expect(buttonClickHandler).not.toHaveBeenCalled();
    button[0].click();
    expect(buttonClickHandler).toHaveBeenCalledWith(dispatch);
  });
});
