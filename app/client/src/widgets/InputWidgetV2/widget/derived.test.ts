import _ from "lodash";
import { InputTypes } from "widgets/BaseInputWidget/constants";
import derivedProperty from "./derived";

describe("Derived property - InputWidgetV2", () => {
  describe("Common behaviors across input types", () => {
    describe("Required field validation", () => {
      it("should validate when field is not required", () => {
        // NUMBER - not required, empty
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

        // TEXT - not required, empty
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

        // EMAIL - not required, empty
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

        // PASSWORD - not required, empty
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
      });

      it("should validate when field is required but empty", () => {
        // NUMBER - required, empty
        let isValid = derivedProperty.isValid(
          {
            inputType: InputTypes.NUMBER,
            inputText: "",
            isRequired: true,
          },
          null,
          _,
        );

        expect(isValid).toBeFalsy();

        // TEXT - required, empty
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

        // EMAIL - required, empty
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

        // PASSWORD - required, empty
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
      });

      it("should validate when field is required with valid values", () => {
        // NUMBER - required, valid
        let isValid = derivedProperty.isValid(
          {
            inputType: InputTypes.NUMBER,
            inputText: 1,
            isRequired: true,
          },
          null,
          _,
        );

        expect(isValid).toBeTruthy();

        // TEXT - required, valid
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

        // EMAIL - required, valid
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

        // PASSWORD - required, valid
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
    });

    describe("Custom validation", () => {
      it("should respect custom validation across all input types", () => {
        // TEXT with custom validation = false
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

        // TEXT with custom validation = true
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

        // NUMBER with custom validation = false
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

        // NUMBER with custom validation = true
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

        // EMAIL with custom validation = false
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

        // EMAIL with custom validation = true
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

        // PASSWORD with custom validation = false
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

        // PASSWORD with custom validation = true
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
    });

    describe("Regex validation", () => {
      it("should validate against regex for all input types", () => {
        // TEXT with matching regex
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

        // TEXT with non-matching regex
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

        // NUMBER with matching regex
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

        // NUMBER with non-matching regex
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

        // EMAIL with matching regex
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

        // EMAIL with non-matching regex
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

        // PASSWORD with matching regex
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

        // PASSWORD with non-matching regex
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
    });
  });

  describe("NUMBER input type specific behaviors", () => {
    it("should validate different number formats", () => {
      // Integer value
      let isValid = derivedProperty.isValid(
        {
          inputType: InputTypes.NUMBER,
          inputText: 1,
          isRequired: true,
        },
        null,
        _,
      );

      expect(isValid).toBeTruthy();

      // Decimal value
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

      // Invalid number (string)
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

      // Null value
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

      // Undefined value
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
    });
  });

  describe("EMAIL input type specific behaviors", () => {
    it("should validate email format", () => {
      // Valid email
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

      // Invalid email (no @ symbol)
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

      // Email with uppercase domain
      isValid = derivedProperty.isValid(
        {
          inputType: InputTypes.EMAIL,
          inputText: "test@appsmith.INFO",
          isRequired: true,
        },
        null,
        _,
      );
      expect(isValid).toBeTruthy();

      // Email with special characters
      isValid = derivedProperty.isValid(
        {
          inputType: InputTypes.EMAIL,
          inputText: "test+123@appsmith.com",
          isRequired: true,
        },
        null,
        _,
      );
      expect(isValid).toBeTruthy();
    });
  });
});
