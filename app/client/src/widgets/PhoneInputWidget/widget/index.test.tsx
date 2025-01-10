import type { PhoneInputWidgetProps } from "./index";
import { defaultValueValidation } from "./index";
import PhoneInputWidget from "./index";
import _ from "lodash";

describe("defaultValueValidation", () => {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: any;

  it("should validate defaulttext", () => {
    result = defaultValueValidation(
      "0000000000",
      {} as PhoneInputWidgetProps,
      _,
    );

    expect(result).toEqual({
      isValid: true,
      parsed: "0000000000",
      messages: [{ name: "", message: "" }],
    });
  });

  it("should validate defaulttext with object value", () => {
    const value = {};

    result = defaultValueValidation(value, {} as PhoneInputWidgetProps, _);

    expect(result).toEqual({
      isValid: false,
      parsed: JSON.stringify(value, null, 2),
      messages: [
        {
          name: "TypeError",
          message: "This value must be string",
        },
      ],
    });
  });
});

describe("PhoneInputWidget methods", () => {
  describe("getSetterConfig", () => {
    it("should return correct setter config with setText", () => {
      const setterConfig = PhoneInputWidget.getSetterConfig();

      expect(setterConfig.__setters).toHaveProperty("setText");

      expect(setterConfig.__setters.setText).toEqual({
        path: "defaultText",
        type: "string",
      });
    });

    it("should include all required setters", () => {
      const setterConfig = PhoneInputWidget.getSetterConfig();
      const expectedSetters = ["setVisibility", "setDisabled", "setText"];

      expectedSetters.forEach((setter) => {
        expect(setterConfig.__setters).toHaveProperty(setter);
      });
    });
  });
});
