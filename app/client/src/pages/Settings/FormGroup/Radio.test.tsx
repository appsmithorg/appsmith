import { render } from "test/testUtils";
import React from "react";
import {
  Setting,
  SettingTypes,
} from "@appsmith/pages/AdminSettings/config/types";
import Radio from "./Radio";
import { SETTINGS_FORM_NAME } from "@appsmith/constants/forms";
import { reduxForm } from "redux-form";

let container: any = null;
const setting: Setting = {
  id: "SETTING_RADIO",
  name: "SETTING_RADIO",
  category: "test category",
  controlType: SettingTypes.RADIO,
  label: "test label",
  controlTypeProps: {
    options: [
      {
        label: "Label one",
        value: "ONE",
      },
      {
        label: "Label two",
        value: "TWO",
      },
    ],
  },
  format: (value) => {
    return { value };
  },
  parse: (value) => {
    return value.value;
  },
};

function renderComponent() {
  function RadioFieldComponent() {
    return <Radio data-cy="t--radio" setting={setting} />;
  }
  const Parent = reduxForm<any, any>({
    validate: () => {
      return {};
    },
    form: SETTINGS_FORM_NAME,
    touchOnBlur: true,
  })(RadioFieldComponent);

  render(<Parent />, {
    initialState: {
      form: {
        [SETTINGS_FORM_NAME]: {
          values: {
            [setting.id]: "TWO",
          },
        },
      },
    },
  });
}

describe("Radio", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("is rendered", () => {
    renderComponent();
    const radioOptions: NodeListOf<HTMLInputElement> = document.querySelectorAll(
      "input[type=radio]",
    );
    const numberOfCheckboxes = radioOptions.length;
    expect(numberOfCheckboxes).toEqual(
      setting.controlTypeProps?.options.length,
    );
    expect(radioOptions[1].checked).toBeTruthy();
  });
});
