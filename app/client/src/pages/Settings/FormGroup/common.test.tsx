import { render, screen } from "test/testUtils";
import React from "react";
import { SettingTypes } from "@appsmith/pages/AdminSettings/config/types";
import { FormGroup } from "./Common";

let container: any = null;
const setting = {
  id: "SETTING_ID",
  label: "formGroup",
  helpText: "",
  subText: "",
  category: "test",
  controlType: SettingTypes.BUTTON,
};
const CLASSNAME = "form-group";

function renderComponent() {
  render(
    <FormGroup className={CLASSNAME} setting={setting}>
      <div data-testid="admin-settings-form-group-child" />
    </FormGroup>,
    container,
  );
}

describe("FormGroup", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("is rendered", () => {
    renderComponent();
    const formGroup = screen.queryAllByTestId("admin-settings-form-group");
    expect(formGroup).toHaveLength(1);
    expect(formGroup[0].className).toContain(CLASSNAME);
    const formGroupLabel = screen.queryAllByTestId(
      "admin-settings-form-group-label",
    );
    expect(formGroupLabel).toHaveLength(1);
    expect(formGroupLabel[0].textContent).toBe(setting.label);
    const formGroupHelpText = screen.queryAllByTestId(
      "admin-settings-form-group-helptext",
    );
    expect(formGroupHelpText).toHaveLength(0);
    const formGroupSubtext = screen.queryAllByTestId(
      "admin-settings-form-group-subtext",
    );
    expect(formGroupSubtext).toHaveLength(0);
  });

  it("is rendered with helpText", () => {
    setting.helpText = "some help text";
    renderComponent();
    const formGroupHelpText = screen.queryAllByTestId(
      "admin-settings-form-group-helptext",
    );
    expect(formGroupHelpText).toHaveLength(1);
  });

  it("is rendered with subText", () => {
    setting.subText = "some sub text";
    renderComponent();
    const formGroupSubtext = screen.queryAllByTestId(
      "admin-settings-form-group-subtext",
    );
    expect(formGroupSubtext).toHaveLength(1);
    expect(formGroupSubtext[0].textContent).toBe(`* ${setting.subText}`);
  });

  it("is rendered with children", () => {
    renderComponent();
    const formGroupChild = screen.queryAllByTestId(
      "admin-settings-form-group-child",
    );
    expect(formGroupChild).toHaveLength(1);
  });
});
