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
          rawText: undefined,
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
          rawText: "test",
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
          rawText: null,
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
          rawText: undefined,
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
          rawText: "",
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
          rawText: 1,
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
          rawText: 1.1,
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
          rawText: "",
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
          rawText: "",
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
          rawText: "test",
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
          rawText: "",
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
          rawText: "",
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
          rawText: "test@appsmith.com",
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
          rawText: "",
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
          rawText: "",
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
          rawText: "admin",
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
          rawText: "test",
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
          rawText: "test",
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
          rawText: 1,
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
          rawText: 1,
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
          rawText: "test@appsmith.com",
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
          rawText: "test@appsmith.com",
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
          rawText: "admin123",
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
          rawText: "admin123",
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
          rawText: "test",
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
          rawText: "test123",
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
          rawText: 1,
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
          rawText: 2,
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
          rawText: "test@appsmith.com",
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
          rawText: "test123@appsmith.com",
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
          rawText: "admin123",
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
          rawText: "admin1234",
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
          rawText: "test@appsmith.com",
          isRequired: true,
        },
        null,
        _,
      );

      expect(isValid).toBeTruthy();

      isValid = derivedProperty.isValid(
        {
          inputType: InputTypes.EMAIL,
          rawText: "test",
          isRequired: true,
        },
        null,
        _,
      );

      expect(isValid).toBeFalsy();

      isValid = derivedProperty.isValid(
        {
          inputType: InputTypes.EMAIL,
          rawText: "test@appsmith.INFO",
          isRequired: true,
        },
        null,
        _,
      );

      expect(isValid).toBeTruthy();
    });
  });
});
