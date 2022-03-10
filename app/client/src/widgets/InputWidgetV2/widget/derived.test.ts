import _ from "lodash";
import { InputTypes } from "widgets/BaseInputWidget/constants";
import derivedProperty from "./derived";

describe("Derived property - ", () => {
  describe("isValid property", () => {
    it("should test isRequired", () => {
      //Number input with required false and empty value
      let isValid = derivedProperty.isValid(
        {
          inputType: InputTypes.NUMBER,
          inputText: undefined,
          isRequired: false,
        },
        null,
        _,
      );

      expect(isValid).toBeTruthy();

      //Number input with required true and invalid value
      isValid = derivedProperty.isValid(
        {
          inputType: InputTypes.NUMBER,
          inputText: "test",
          isRequired: true,
        },
        null,
        _,
      );

      expect(isValid).toBeFalsy();

      //Number input with required true and invalid value `null`
      isValid = derivedProperty.isValid(
        {
          inputType: InputTypes.NUMBER,
          inputText: null,
          isRequired: true,
        },
        null,
        _,
      );

      expect(isValid).toBeFalsy();

      //Number input with required true and invalid value `undefined`
      isValid = derivedProperty.isValid(
        {
          inputType: InputTypes.NUMBER,
          inputText: undefined,
          isRequired: true,
        },
        null,
        _,
      );

      expect(isValid).toBeFalsy();

      //Number input with required true and invalid value `""`
      isValid = derivedProperty.isValid(
        {
          inputType: InputTypes.NUMBER,
          inputText: "",
          isRequired: true,
        },
        null,
        _,
      );

      expect(isValid).toBeFalsy();

      //Number input with required true and valid value
      isValid = derivedProperty.isValid(
        {
          inputType: InputTypes.NUMBER,
          inputText: 1,
          isRequired: true,
        },
        null,
        _,
      );

      expect(isValid).toBeTruthy();

      //Number input with required true and valid value
      isValid = derivedProperty.isValid(
        {
          inputType: InputTypes.NUMBER,
          inputText: 1.1,
          isRequired: true,
        },
        null,
        _,
      );

      expect(isValid).toBeTruthy();

      //Text input with required false and empty value
      isValid = derivedProperty.isValid(
        {
          inputType: InputTypes.TEXT,
          inputText: "",
          isRequired: false,
        },
        null,
        _,
      );

      expect(isValid).toBeTruthy();

      //Text input with required true and invalid value
      isValid = derivedProperty.isValid(
        {
          inputType: InputTypes.TEXT,
          inputText: "",
          isRequired: true,
        },
        null,
        _,
      );

      expect(isValid).toBeFalsy();

      //Text input with required true and valid value
      isValid = derivedProperty.isValid(
        {
          inputType: InputTypes.TEXT,
          inputText: "test",
          isRequired: true,
        },
        null,
        _,
      );

      expect(isValid).toBeTruthy();

      //Email input with required false and empty value
      isValid = derivedProperty.isValid(
        {
          inputType: InputTypes.EMAIL,
          inputText: "",
          isRequired: false,
        },
        null,
        _,
      );

      expect(isValid).toBeTruthy();

      //Email input with required true and invalid value
      isValid = derivedProperty.isValid(
        {
          inputType: InputTypes.EMAIL,
          inputText: "",
          isRequired: true,
        },
        null,
        _,
      );

      expect(isValid).toBeFalsy();

      //Email input with required true and valid value
      isValid = derivedProperty.isValid(
        {
          inputType: InputTypes.EMAIL,
          inputText: "test@appsmith.com",
          isRequired: true,
        },
        null,
        _,
      );

      expect(isValid).toBeTruthy();

      //Password input with required false and empty value
      isValid = derivedProperty.isValid(
        {
          inputType: InputTypes.PASSWORD,
          inputText: "",
          isRequired: false,
        },
        null,
        _,
      );

      expect(isValid).toBeTruthy();

      //Password input with required true and invalid value
      isValid = derivedProperty.isValid(
        {
          inputType: InputTypes.PASSWORD,
          inputText: "",
          isRequired: true,
        },
        null,
        _,
      );

      expect(isValid).toBeFalsy();

      //Password input with required true and valid value
      isValid = derivedProperty.isValid(
        {
          inputType: InputTypes.PASSWORD,
          inputText: "admin",
          isRequired: true,
        },
        null,
        _,
      );

      expect(isValid).toBeTruthy();
    });

    it("should test validation", () => {
      let isValid = derivedProperty.isValid(
        {
          inputType: InputTypes.TEXT,
          inputText: "test",
          isRequired: true,
          validation: false,
        },
        null,
        _,
      );

      expect(isValid).toBeFalsy();

      isValid = derivedProperty.isValid(
        {
          inputType: InputTypes.TEXT,
          inputText: "test",
          isRequired: true,
          validation: true,
        },
        null,
        _,
      );

      expect(isValid).toBeTruthy();

      isValid = derivedProperty.isValid(
        {
          inputType: InputTypes.NUMBER,
          inputText: 1,
          isRequired: true,
          validation: false,
        },
        null,
        _,
      );

      expect(isValid).toBeFalsy();

      isValid = derivedProperty.isValid(
        {
          inputType: InputTypes.NUMBER,
          inputText: 1,
          isRequired: true,
          validation: true,
        },
        null,
        _,
      );

      expect(isValid).toBeTruthy();

      isValid = derivedProperty.isValid(
        {
          inputType: InputTypes.EMAIL,
          inputText: "test@appsmith.com",
          isRequired: true,
          validation: false,
        },
        null,
        _,
      );

      expect(isValid).toBeFalsy();

      isValid = derivedProperty.isValid(
        {
          inputType: InputTypes.EMAIL,
          inputText: "test@appsmith.com",
          isRequired: true,
          validation: true,
        },
        null,
        _,
      );

      expect(isValid).toBeTruthy();

      isValid = derivedProperty.isValid(
        {
          inputType: InputTypes.PASSWORD,
          inputText: "admin123",
          isRequired: true,
          validation: false,
        },
        null,
        _,
      );

      expect(isValid).toBeFalsy();

      isValid = derivedProperty.isValid(
        {
          inputType: InputTypes.PASSWORD,
          inputText: "admin123",
          isRequired: true,
          validation: true,
        },
        null,
        _,
      );

      expect(isValid).toBeTruthy();
    });

    it("should test regex validation", () => {
      let isValid = derivedProperty.isValid(
        {
          inputType: InputTypes.TEXT,
          inputText: "test",
          isRequired: true,
          regex: "^test$",
        },
        null,
        _,
      );

      expect(isValid).toBeTruthy();

      isValid = derivedProperty.isValid(
        {
          inputType: InputTypes.TEXT,
          inputText: "test123",
          isRequired: true,
          regex: "^test$",
        },
        null,
        _,
      );

      expect(isValid).toBeFalsy();

      isValid = derivedProperty.isValid(
        {
          inputType: InputTypes.NUMBER,
          inputText: 1,
          isRequired: true,
          regex: "^1$",
        },
        null,
        _,
      );

      expect(isValid).toBeTruthy();

      isValid = derivedProperty.isValid(
        {
          inputType: InputTypes.NUMBER,
          inputText: 2,
          isRequired: true,
          regex: "^1$",
        },
        null,
        _,
      );

      expect(isValid).toBeFalsy();

      isValid = derivedProperty.isValid(
        {
          inputType: InputTypes.EMAIL,
          inputText: "test@appsmith.com",
          isRequired: true,
          regex: "^test@appsmith.com$",
        },
        null,
        _,
      );

      expect(isValid).toBeTruthy();

      isValid = derivedProperty.isValid(
        {
          inputType: InputTypes.EMAIL,
          inputText: "test123@appsmith.com",
          isRequired: true,
          regex: "^test@appsmith.com$",
        },
        null,
        _,
      );

      expect(isValid).toBeFalsy();

      isValid = derivedProperty.isValid(
        {
          inputType: InputTypes.PASSWORD,
          inputText: "admin123",
          isRequired: true,
          regex: "^admin123$",
        },
        null,
        _,
      );

      expect(isValid).toBeTruthy();

      isValid = derivedProperty.isValid(
        {
          inputType: InputTypes.PASSWORD,
          inputText: "admin1234",
          isRequired: true,
          regex: "^admin123$",
        },
        null,
        _,
      );

      expect(isValid).toBeFalsy();
    });

    it("should test email type built in validation", () => {
      let isValid = derivedProperty.isValid(
        {
          inputType: InputTypes.EMAIL,
          inputText: "test@appsmith.com",
          isRequired: true,
        },
        null,
        _,
      );

      expect(isValid).toBeTruthy();

      isValid = derivedProperty.isValid(
        {
          inputType: InputTypes.EMAIL,
          inputText: "test",
          isRequired: true,
        },
        null,
        _,
      );

      expect(isValid).toBeFalsy();
    });
  });

  describe("getText property", () => {
    let text = derivedProperty.getText(
      {
        inputType: InputTypes.TEXT,
        inputText: "test",
      },
      null,
      _,
    );

    expect(text).toBe("test");

    text = derivedProperty.getText(
      {
        inputType: InputTypes.PASSWORD,
        inputText: "test1",
      },
      null,
      _,
    );

    expect(text).toBe("test1");

    text = derivedProperty.getText(
      {
        inputType: InputTypes.EMAIL,
        inputText: "test@appsmith.com",
      },
      null,
      _,
    );

    expect(text).toBe("test@appsmith.com");

    text = derivedProperty.getText(
      {
        inputType: InputTypes.NUMBER,
        inputText: "",
      },
      null,
      _,
    );

    expect(text).toBe(null);

    text = derivedProperty.getText(
      {
        inputType: InputTypes.NUMBER,
        inputText: undefined,
      },
      null,
      _,
    );

    expect(text).toBe(null);

    text = derivedProperty.getText(
      {
        inputType: InputTypes.NUMBER,
        inputText: null,
      },
      null,
      _,
    );

    expect(text).toBe(null);

    text = derivedProperty.getText(
      {
        inputType: InputTypes.NUMBER,
        inputText: 1,
      },
      null,
      _,
    );

    expect(text).toBe(1);

    text = derivedProperty.getText(
      {
        inputType: InputTypes.NUMBER,
        inputText: "1.01",
      },
      null,
      _,
    );

    expect(text).toBe(1.01);

    text = derivedProperty.getText(
      {
        inputType: InputTypes.NUMBER,
        inputText: "1.00",
      },
      null,
      _,
    );

    expect(text).toBe(1);
  });
});
