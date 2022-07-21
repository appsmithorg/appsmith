import { render, screen } from "test/testUtils";
import React from "react";
import { SettingTypes } from "@appsmith/pages/AdminSettings/config/types";
import TextComponent from "./Text";

let container: any = null;
const buttonClickHandler = jest.fn();
const setting = {
  id: "SETTING_ID",
  name: "textType",
  text: "download",
  action: buttonClickHandler,
  category: "test",
  controlType: SettingTypes.TEXT,
};

const useSelector = jest.fn();
const settingsConfig = {
  textType: "some text value",
};
useSelector.mockReturnValue(settingsConfig);

function renderComponent() {
  render(<TextComponent setting={setting} />, {
    initialState: {
      settings: {
        isLoading: false,
        isSaving: false,
        isRestarting: false,
        showReleaseNotes: false,
        isRestartFailed: false,
        config: settingsConfig,
      },
    },
  });
}

describe("Text", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("is rendered", () => {
    renderComponent();
    const text = screen.queryAllByTestId("admin-settings-text");
    expect(text).toHaveLength(1);
    expect(text[0].textContent).toBe(settingsConfig.textType);
  });
});
