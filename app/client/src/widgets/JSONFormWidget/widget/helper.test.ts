import {
  ARRAY_ITEM_KEY,
  DataType,
  FieldType,
  ROOT_SCHEMA_KEY,
  Schema,
} from "../constants";
import schemaTestData from "../schemaTestData";
import {
  dynamicPropertyPathListFromSchema,
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

describe(".dynamicPropertyPathListFromSchema", () => {
  it("returns valid auto JS enabled propertyPaths", () => {
    const schema = ({
      [ROOT_SCHEMA_KEY]: {
        identifier: ROOT_SCHEMA_KEY,
        fieldType: FieldType.OBJECT,
        children: {
          name: {
            fieldType: FieldType.TEXT,
            identifier: "name",
            defaultValue: "{{sourceData.name}}",
          },
          dob: {
            fieldType: FieldType.DATE,
            identifier: "dob",
            defaultValue: "{{sourceData.{dob}}",
          },
          obj: {
            fieldType: FieldType.OBJECT,
            identifier: "obj",
            defaultValue: "{{sourceData.{obj}}",
            children: {
              agree: {
                fieldType: FieldType.SWITCH,
                identifier: "agree",
                defaultValue: "{{sourceData.agree}}",
              },
            },
          },
          array: {
            fieldType: FieldType.ARRAY,
            identifier: "array",
            defaultValue: "{{sourceData.array}}",
            children: {
              [ARRAY_ITEM_KEY]: {
                fieldType: FieldType.OBJECT,
                identifier: ARRAY_ITEM_KEY,
                defaultValue: "",
                children: {
                  field1: {
                    fieldType: FieldType.SWITCH,
                    identifier: "field1",
                    defaultValue: "{{sourceData.field1}}",
                  },
                  field2: {
                    fieldType: FieldType.DATE,
                    identifier: "field2",
                    defaultValue: "{{sourceData.field2}}",
                  },
                  field3: {
                    fieldType: FieldType.DATE,
                    identifier: "field3",
                    defaultValue: "10/12/2021",
                  },
                  field4: {
                    fieldType: FieldType.CHECKBOX,
                    identifier: "field4",
                    defaultValue: "{{sourceData.field1}}",
                  },
                  field5: {
                    fieldType: FieldType.PHONE_NUMBER,
                    identifier: "field5",
                    defaultValue: "{{sourceData.field1}}",
                  },
                },
              },
            },
          },
        },
      },
    } as unknown) as Schema;

    const expectedPathList = [
      `schema.${ROOT_SCHEMA_KEY}.children.dob.defaultValue`,
      `schema.${ROOT_SCHEMA_KEY}.children.obj.children.agree.defaultValue`,
      `schema.${ROOT_SCHEMA_KEY}.children.array.children.${ARRAY_ITEM_KEY}.children.field1.defaultValue`,
      `schema.${ROOT_SCHEMA_KEY}.children.array.children.${ARRAY_ITEM_KEY}.children.field2.defaultValue`,
      `schema.${ROOT_SCHEMA_KEY}.children.array.children.${ARRAY_ITEM_KEY}.children.field4.defaultValue`,
    ];

    const result = dynamicPropertyPathListFromSchema(schema);

    expect(result).toEqual(expectedPathList);
  });
});
