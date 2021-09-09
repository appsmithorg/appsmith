/* eslint-disable @typescript-eslint/no-namespace */
import { isString, get } from "lodash";

import config from "./propertyConfig";
import { PropertyPaneControlConfig } from "constants/PropertyControlConstants";

declare global {
  namespace jest {
    interface Matchers<R> {
      toBePropertyPaneConfig(): R;
    }
  }
}
const validateControl = (control: Record<string, unknown>) => {
  if (typeof control !== "object") return false;
  const properties = [
    "propertyName",
    "controlType",
    "isBindProperty",
    "isTriggerProperty",
  ];
  properties.forEach((prop: string) => {
    if (!control.hasOwnProperty(prop)) {
      return false;
    }
    const value = control[prop];
    if (isString(value) && value.length === 0) return false;
  });
  return true;
};

const validateSection = (section: Record<string, unknown>) => {
  if (typeof section !== "object") return false;
  if (!section.hasOwnProperty("sectionName")) return false;
  const name = section.sectionName;
  if ((name as string).length === 0) return false;
  if (section.children) {
    return (section.children as Array<Record<string, unknown>>).forEach(
      (child) => {
        if (!validateControl(child)) return false;
      },
    );
  }
  return true;
};

expect.extend({
  toBePropertyPaneConfig(received) {
    if (Array.isArray(received)) {
      let pass = true;
      received.forEach((section) => {
        if (!validateSection(section) && !validateControl(section))
          pass = false;
      });
      return {
        pass,
        message: () => "Expected value to be a property pane config internal",
      };
    }
    return {
      pass: false,
      message: () => "Expected value to be a property pane config external",
    };
  },
});

describe("Validate Chart Widget's property config", () => {
  it("Validates Chart Widget's property config", () => {
    expect(config).toBePropertyPaneConfig();
  });

  it("Validates config when chartType is CUSTOM_FUSION_CHART", () => {
    const hiddenFn: (props: any) => boolean = get(
      config,
      "[0].children.[2].hidden",
    );
    let result = true;
    if (hiddenFn) result = hiddenFn({ chartType: "CUSTOM_FUSION_CHART" });
    expect(result).toBeFalsy();
  });

  it("Validates that sections are hidden when chartType is CUSTOM_FUSION_CHART", () => {
    const hiddenFns = [
      get(config, "[0].children.[3].hidden"),
      get(config, "[1].children.[0].hidden"),
      get(config, "[1].children.[1].hidden"),
      get(config, "[1].children.[2].hidden"),
    ];
    hiddenFns.forEach((fn: (props: any) => boolean) => {
      const result = fn({ chartType: "CUSTOM_FUSION_CHART" });
      expect(result).toBeTruthy();
    });
  });

  it("Validates that axis labelOrientation is visible when chartType are LINE_CHART AREA_CHART COLUMN_CHART", () => {
    const allowedChartsTypes = ["LINE_CHART", "AREA_CHART", "COLUMN_CHART"];

    const axisSection = config.find((c) => c.sectionName === "Axis");
    const labelOrientationProperty = ((axisSection?.children as unknown) as PropertyPaneControlConfig[]).find(
      (p) => p.propertyName === "labelOrientation",
    );

    allowedChartsTypes.forEach((chartType) => {
      const result = labelOrientationProperty?.hidden?.({ chartType }, "");
      expect(result).toBeFalsy();
    });
  });
});
