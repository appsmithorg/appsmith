import React from "react";
import "@testing-library/jest-dom";
import KeyValueFieldArray from "../KeyValueFieldArray";
import { reduxForm } from "redux-form";
import { render } from "test/testUtils";

const initialProps = {
  name: "Headers",
  actionConfig: [] as Array<{ key: string; value: string }>,
  dataTreePath: ".config.headers",
  hideHeader: false,
  label: "Headers",
  placeholder: "Value",
  pushFields: true,
  theme: "LIGHT",
  hasType: false,
};

let rendererTimer: any;

function getComponent(props: any) {
  function keyValueComponent() {
    return <KeyValueFieldArray {...props} />;
  }
  const Parent = reduxForm<any, any>({
    validate: () => {
      return {};
    },
    form: "HeaderForm",
    touchOnBlur: true,
  })(keyValueComponent);

  return <Parent />;
}

describe("Bug 11832: KeyValueFieldArray", () => {
  it("If no headers data is there, it must maintain 2 pairs of empty fields by default", () => {
    render(getComponent(initialProps));
    rendererTimer = setTimeout(() => {
      const headerDivs = document.querySelectorAll('div[class*="t--Headers"]');
      expect(headerDivs.length).toBe(2);
    }, 0);
  });

  it("If headers data is there, it need not maintain pairs of empty fields", () => {
    initialProps.actionConfig.push({ key: "p1", value: "p2" });
    initialProps.actionConfig.push({ key: "p1", value: "p2" });
    initialProps.actionConfig.push({ key: "p1", value: "p2" });
    initialProps.actionConfig.push({ key: "p1", value: "p2" });
    render(getComponent(initialProps));
    rendererTimer = setTimeout(() => {
      const headerDivs = document.querySelectorAll('div[class*="t--Headers"]');
      expect(headerDivs.length).toBe(4);
    }, 0);
  });

  afterEach(() => {
    clearTimeout(rendererTimer);
    rendererTimer = undefined;
  });
});
