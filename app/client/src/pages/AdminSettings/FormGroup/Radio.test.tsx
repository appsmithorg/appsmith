import { render } from "test/testUtils";
import React from "react";
import type { Setting } from "ee/pages/AdminSettings/config/types";
import { SettingTypes } from "ee/pages/AdminSettings/config/types";
import Radio from "./Radio";
import { SETTINGS_FORM_NAME } from "ee/constants/forms";
import { reduxForm } from "redux-form";

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    return <Radio data-testid="t--radio" setting={setting} />;
  }
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    const radioOptions: NodeListOf<HTMLInputElement> =
      document.querySelectorAll("input[type=radio]");
    const numberOfCheckboxes = radioOptions.length;
    expect(numberOfCheckboxes).toEqual(
      setting.controlTypeProps?.options.length,
    );
    expect(radioOptions[1].checked).toBeTruthy();
  });
});
