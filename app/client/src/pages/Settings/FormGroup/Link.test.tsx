import { render, screen } from "test/testUtils";
import React from "react";
import { SettingTypes } from "@appsmith/pages/AdminSettings/config/types";
import Link from "./Link";

let container: any = null;
const linkClickHandler = jest.fn();
const setting = {
  id: "SETTING_ID",
  isHidden: false,
  label: "setting label",
  action: linkClickHandler,
  category: "test",
  controlType: SettingTypes.LINK,
  url: "",
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
  render(<Link setting={setting} />);
}

describe("Link", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("is rendered", () => {
    renderComponent();
    const link = screen.queryAllByTestId("admin-settings-link");
    expect(link).toHaveLength(1);
  });

  it("is rendered with label", () => {
    renderComponent();
    const linkLabel = screen.queryAllByTestId("admin-settings-link-label");
    expect(linkLabel).toHaveLength(1);
    expect(linkLabel[0].textContent).toBe(setting.label);
  });

  it("is rendered with click handler", () => {
    renderComponent();
    const linkAnchor = screen.queryAllByTestId("admin-settings-link-anchor");
    expect(linkAnchor).toHaveLength(1);
    expect(linkClickHandler).not.toHaveBeenCalled();
    linkAnchor[0].click();
    expect(linkClickHandler).toHaveBeenCalledWith(dispatch);
  });

  it("is rendered with href", () => {
    const url = "http://test.appsmith.com";
    setting.url = url;
    renderComponent();
    const linkAnchor = screen.queryAllByTestId("admin-settings-link-anchor");
    expect(linkAnchor).toHaveLength(1);
    expect(linkAnchor[0].getAttribute("href")).toBe(url);
    expect(linkAnchor[0].getAttribute("target")).toBe("_blank");
  });
});
