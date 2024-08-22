import React from "react";

import { SETTINGS_FORM_NAME } from "ee/constants/forms";
import type { Setting } from "ee/pages/AdminSettings/config/types";
import {
  SettingSubtype,
  SettingTypes,
} from "ee/pages/AdminSettings/config/types";
import { reduxForm } from "redux-form";
import { render } from "test/testUtils";

import TextInput from "./TextInput";

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let container: any = null;
const setting: Setting = {
  id: "SETTING_TEXT_INPUT_ID",
  name: "SETTING_TEXT_INPUT_ID",
  category: "test category",
  controlType: SettingTypes.TEXTINPUT,
  controlSubType: SettingSubtype.TEXT,
  label: "test label",
};

function renderComponent() {
  function TextInputFieldComponent() {
    return <TextInput setting={setting} />;
  }
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Parent = reduxForm<any, any>({
    validate: () => {
      return {};
    },
    form: SETTINGS_FORM_NAME,
    touchOnBlur: true,
  })(TextInputFieldComponent);

  render(<Parent />, {
    initialState: {
      form: {
        [SETTINGS_FORM_NAME]: {
          values: {
            [setting.id]: "test value",
          },
        },
      },
    },
  });
}

describe("Text Input", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("is rendered", () => {
    renderComponent();
    const inputEl = document.querySelector("input");
    expect(inputEl?.value).toBeDefined();
    expect(inputEl?.value).toEqual("test value");
  });
});
