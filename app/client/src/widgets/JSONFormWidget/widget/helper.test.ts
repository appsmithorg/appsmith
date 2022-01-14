import { DataType, FieldType } from "../constants";
import schemaTestData from "../schemaTestData";
import {
  generateFieldState,
  getGrandParentPropertyPath,
  getParentPropertyPath,
} from "./helper";

describe(".getParentPropertyPath", () => {
  it("returns parent path", () => {
    const inputs = ["", "a.b.c", "a", "a.b"];
    const expectedOutputs = ["", "a.b", "", "a"];

    inputs.forEach((input, index) => {
      const result = getParentPropertyPath(input);

      expect(result).toEqual(expectedOutputs[index]);
    });
  });
});

describe(".getGrandParentPropertyPath", () => {
  it("returns parent path", () => {
    const inputs = ["", "a.b.c", "a", "a.b", "a.b.c.d"];
    const expectedOutputs = ["", "a", "", "", "a.b"];

    inputs.forEach((input, index) => {
      const result = getGrandParentPropertyPath(input);

      expect(result).toEqual(expectedOutputs[index]);
    });
  });
});

describe(".generateFieldState", () => {
  it("returns fieldState for initial render", () => {
    const { schemaOutput } = schemaTestData.initialDataset;
    const fieldValidityState = {};
    const expectedOutput = {
      name: {
        isRequired: false,
        isDisabled: false,
        isVisible: true,
        isValid: undefined,
      },
      age: {
        isRequired: false,
        isDisabled: false,
        isVisible: true,
        isValid: undefined,
      },
      dob: {
        isRequired: false,
        isDisabled: false,
        isVisible: true,
        isValid: undefined,
      },
      boolean: {
        isRequired: false,
        isDisabled: false,
        isVisible: true,
        isValid: undefined,
      },
      hobbies: {
        isRequired: false,
        isDisabled: false,
        isVisible: true,
        isValid: undefined,
      },
      __: {
        isRequired: false,
        isDisabled: false,
        isVisible: true,
        isValid: undefined,
      },
      education: [],
      address: {
        Line1: {
          isRequired: false,
          isDisabled: false,
          isVisible: true,
          isValid: undefined,
        },
        city: {
          isRequired: false,
          isDisabled: false,
          isVisible: true,
          isValid: undefined,
        },
      },
    };

    const result = generateFieldState(schemaOutput, fieldValidityState);

    expect(result).toEqual(expectedOutput);
  });

  it("returns updated fieldState same prevFieldState and empty fieldValidityState", () => {
    const schema = {
      __root_schema__: {
        children: {
          customField1: {
            children: {},
            dataType: DataType.STRING,
            fieldType: FieldType.TEXT,
            sourceData: "",
            isCustomField: true,
            name: "customField1",
            accessor: "customField1",
            identifier: "customField1",
            position: 0,
            originalIdentifier: "customField1",
            isDisabled: false,
            label: "Custom Field 1",
            isVisible: true,
            isRequired: true,
            isSpellCheck: false,
          },
          array: {
            children: {
              __array_item__: {
                children: {
                  name: {
                    children: {},
                    dataType: DataType.STRING,
                    fieldType: FieldType.TEXT,
                    sourceData: "",
                    isCustomField: false,
                    name: "name",
                    accessor: "name",
                    identifier: "name",
                    position: 0,
                    originalIdentifier: "name",
                    isDisabled: false,
                    label: "Name",
                    isVisible: true,
                    isSpellCheck: false,
                  },
                },
                dataType: DataType.OBJECT,
                fieldType: FieldType.OBJECT,
                sourceData: {
                  name: "",
                },
                isCustomField: false,
                name: "__array_item__",
                accessor: "__array_item__",
                identifier: "__array_item__",
                position: -1,
                originalIdentifier: "__array_item__",
                isDisabled: false,
                label: "Array Item",
                isVisible: true,
              },
            },
            dataType: DataType.ARRAY,
            defaultValue: "",
            fieldType: FieldType.ARRAY,
            sourceData: [
              {
                name: "",
              },
            ],
            isCustomField: false,
            name: "array",
            accessor: "array",
            identifier: "array",
            position: 1,
            originalIdentifier: "array",
            isCollapsible: true,
            isDisabled: false,
            isVisible: true,
            label: "Array",
          },
        },
        dataType: DataType.OBJECT,
        defaultValue:
          "{{((sourceData, formData, fieldState) => (sourceData))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
        fieldType: FieldType.OBJECT,
        sourceData: {
          array: [
            {
              name: "",
            },
          ],
        },
        isCustomField: false,
        name: "",
        accessor: "",
        identifier: "",
        position: -1,
        originalIdentifier: "",
        isDisabled: false,
        isRequired: false,
        isVisible: true,
        label: "",
      },
    };

    const fieldValidityState = {};

    const expectedOutput = {
      customField1: {
        isRequired: true,
        isDisabled: false,
        isVisible: true,
        isValid: undefined,
      },
      array: [],
    };

    const result = generateFieldState(schema, fieldValidityState);

    expect(result).toEqual(expectedOutput);
  });
  it("returns updated fieldState same prevFieldState and partial fieldValidityState", () => {
    const schema = {
      __root_schema__: {
        children: {
          customField1: {
            children: {},
            dataType: DataType.STRING,
            fieldType: FieldType.TEXT,
            sourceData: "",
            isCustomField: true,
            name: "customField1",
            accessor: "customField1",
            identifier: "customField1",
            position: 0,
            originalIdentifier: "customField1",
            isDisabled: false,
            label: "Custom Field 1",
            isVisible: true,
            isRequired: true,
            isSpellCheck: false,
          },
          array: {
            children: {
              __array_item__: {
                children: {
                  name: {
                    children: {},
                    dataType: DataType.STRING,
                    fieldType: FieldType.TEXT,
                    sourceData: "",
                    isCustomField: false,
                    name: "name",
                    accessor: "name",
                    identifier: "name",
                    position: 0,
                    originalIdentifier: "name",
                    isDisabled: false,
                    label: "Name",
                    isVisible: true,
                    isSpellCheck: false,
                    isRequired: false,
                  },
                },
                dataType: DataType.OBJECT,
                fieldType: FieldType.OBJECT,
                sourceData: {
                  name: "",
                },
                isCustomField: false,
                name: "__array_item__",
                accessor: "__array_item__",
                identifier: "__array_item__",
                position: -1,
                originalIdentifier: "__array_item__",
                isDisabled: false,
                label: "Array Item",
                isVisible: true,
              },
            },
            dataType: DataType.ARRAY,
            defaultValue: "",
            fieldType: FieldType.ARRAY,
            sourceData: [
              {
                name: "",
              },
            ],
            isCustomField: false,
            name: "array",
            accessor: "array",
            identifier: "array",
            position: 1,
            originalIdentifier: "array",
            isCollapsible: true,
            isDisabled: false,
            isVisible: true,
            label: "Array",
          },
        },
        dataType: DataType.OBJECT,
        defaultValue:
          "{{((sourceData, formData, fieldState) => (sourceData))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
        fieldType: FieldType.OBJECT,
        sourceData: {
          array: [
            {
              name: "",
            },
          ],
        },
        isCustomField: false,
        name: "",
        accessor: "",
        identifier: "",
        position: -1,
        originalIdentifier: "",
        isDisabled: false,
        isRequired: false,
        isVisible: true,
        label: "",
      },
    };

    const inputAndExpectedOutput = [
      {
        fieldValidityState: {
          customField1: { isValid: true },
          array: [],
        },
        expectedOutput: {
          customField1: {
            isRequired: true,
            isDisabled: false,
            isVisible: true,
            isValid: true,
          },
          array: [],
        },
      },
      {
        fieldValidityState: {
          customField1: { isValid: false },
          array: [{ name: { isValid: false } }, { name: { isValid: true } }],
        },
        expectedOutput: {
          customField1: {
            isRequired: true,
            isDisabled: false,
            isVisible: true,
            isValid: false,
          },
          array: [
            {
              name: {
                isRequired: false,
                isDisabled: false,
                isVisible: true,
                isValid: false,
              },
            },
            {
              name: {
                isRequired: false,
                isDisabled: false,
                isVisible: true,
                isValid: true,
              },
            },
          ],
        },
      },
    ];

    inputAndExpectedOutput.forEach(({ expectedOutput, fieldValidityState }) => {
      const result = generateFieldState(schema, fieldValidityState);
      expect(result).toEqual(expectedOutput);
    });
  });
});
