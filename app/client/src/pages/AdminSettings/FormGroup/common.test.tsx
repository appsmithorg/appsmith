import { render, screen } from "test/testUtils";
import userEvent from "@testing-library/user-event";
import React from "react";
import type { Setting } from "ee/pages/AdminSettings/config/types";
import { SettingTypes } from "ee/pages/AdminSettings/config/types";
import { FormGroup } from "./Common";

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let container: any = null;
const setting: Setting = {
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
    // Reset shared fixture so test outcomes don't depend on order (CodeRabbit
    // flagged cross-test state leakage; new tests below add helpTextLink which
    // compounded the issue).
    setting.helpText = "";
    setting.subText = "";
    setting.helpTextLink = undefined;
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
    expect(formGroupSubtext[0].textContent).toBe(`${setting.subText}`);
  });

  it("is rendered with children", () => {
    renderComponent();
    const formGroupChild = screen.queryAllByTestId(
      "admin-settings-form-group-child",
    );

    expect(formGroupChild).toHaveLength(1);
  });

  it("does not render a tooltip docs link when helpTextLink is unset", async () => {
    setting.helpText = "some help text";
    setting.helpTextLink = undefined;
    renderComponent();
    const helpIcon = screen.getByTestId("admin-settings-form-group-helptext");

    await userEvent.hover(helpIcon);
    expect(
      screen.queryByTestId("admin-settings-form-group-helptext-link"),
    ).toBeNull();
  });

  it("renders a tooltip docs link when helpTextLink is set", async () => {
    setting.helpText = "some help text";
    setting.helpTextLink = "https://docs.appsmith.com/example";
    renderComponent();
    const helpIcon = screen.getByTestId("admin-settings-form-group-helptext");

    await userEvent.hover(helpIcon);
    const tooltipLink = await screen.findByTestId(
      "admin-settings-form-group-helptext-link",
    );

    expect(tooltipLink.getAttribute("href")).toBe(setting.helpTextLink);
    expect(tooltipLink.getAttribute("target")).toBe("_blank");
    expect(tooltipLink.textContent).toBe("Learn more");
  });
});
