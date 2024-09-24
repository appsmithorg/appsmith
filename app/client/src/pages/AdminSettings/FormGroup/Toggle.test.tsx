import { render } from "test/testUtils";
import React from "react";
import type { Setting } from "ee/pages/AdminSettings/config/types";
import { SettingTypes } from "ee/pages/AdminSettings/config/types";
import Toggle from "./Toggle";
import { SETTINGS_FORM_NAME } from "ee/constants/forms";
import { reduxForm } from "redux-form";

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let container: any = null;
const setting: Setting = {
  id: "SETTING_TOGGLE_ID",
  name: "SETTING_TOGGLE_ID",
  category: "test category",
  controlType: SettingTypes.TOGGLE,
  label: "test label",
};

function renderComponent() {
  function ToggleComponent() {
    return <Toggle setting={setting} />;
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Parent = reduxForm<any, any>({
    validate: () => {
      return {};
    },
    form: SETTINGS_FORM_NAME,
    touchOnBlur: true,
  })(ToggleComponent);

  render(<Parent />, {
    initialState: {
      form: {
        [SETTINGS_FORM_NAME]: {
          values: {
            [setting.id]: false,
          },
        },
      },
    },
  });
}

describe("Toggle", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("is rendered", () => {
    renderComponent();
    const inputEl = document.querySelector("input");

    expect(inputEl?.checked).toBeDefined();
    expect(inputEl?.checked).toEqual(true); // value = ![setting.id]
    expect(inputEl?.hasAttribute("checked"));
  });

  it("when clicked flips the flag", () => {
    renderComponent();
    const inputEl = document.querySelector("input");

    inputEl?.click();
    expect(inputEl?.checked).toEqual(false);
  });
});
