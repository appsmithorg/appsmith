import {
  ARRAY_ITEM_KEY,
  DataType,
  FieldThemeStylesheet,
  FieldType,
  ROOT_SCHEMA_KEY,
  Schema,
} from "../constants";
import schemaTestData from "../schemaTestData";
import {
  ComputedSchemaStatus,
  computeSchema,
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
    const metaInternalFieldState = {};
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
      "%%": {
        isRequired: false,
        isDisabled: false,
        isVisible: true,
        isValid: undefined,
      },
      हिन्दि: {
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

    const result = generateFieldState(schemaOutput, metaInternalFieldState);

    expect(result).toEqual(expectedOutput);
  });

  it("returns updated fieldState same prevFieldState and empty metaInternalFieldState", () => {
    const schema = {
      __root_schema__: {
        children: {
          customField1: {
            children: {},
            dataType: DataType.STRING,
            fieldType: FieldType.TEXT_INPUT,
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
                    fieldType: FieldType.TEXT_INPUT,
                    sourceData: "",
                    isCustomField: false,
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
                accessor: ARRAY_ITEM_KEY,
                identifier: ARRAY_ITEM_KEY,
                position: -1,
                originalIdentifier: ARRAY_ITEM_KEY,
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

    const metaInternalFieldState = {};

    const expectedOutput = {
      customField1: {
        isRequired: true,
        isDisabled: false,
        isVisible: true,
        isValid: undefined,
      },
      array: [],
    };

    const result = generateFieldState(schema, metaInternalFieldState);

    expect(result).toEqual(expectedOutput);
  });
  it("returns updated fieldState same prevFieldState and partial metaInternalFieldState", () => {
    const schema = {
      __root_schema__: {
        children: {
          customField1: {
            children: {},
            dataType: DataType.STRING,
            fieldType: FieldType.TEXT_INPUT,
            sourceData: "",
            isCustomField: true,
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
                    fieldType: FieldType.TEXT_INPUT,
                    sourceData: "",
                    isCustomField: false,
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
                accessor: ARRAY_ITEM_KEY,
                identifier: ARRAY_ITEM_KEY,
                position: -1,
                originalIdentifier: ARRAY_ITEM_KEY,
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
        metaInternalFieldState: {
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
        metaInternalFieldState: {
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

    inputAndExpectedOutput.forEach(
      ({ expectedOutput, metaInternalFieldState }) => {
        const result = generateFieldState(schema, metaInternalFieldState);
        expect(result).toEqual(expectedOutput);
      },
    );
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
            fieldType: FieldType.TEXT_INPUT,
            identifier: "name",
            defaultValue: "{{sourceData.name}}",
          },
          dob: {
            fieldType: FieldType.DATEPICKER,
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
                    fieldType: FieldType.DATEPICKER,
                    identifier: "field2",
                    defaultValue: "{{sourceData.field2}}",
                  },
                  field3: {
                    fieldType: FieldType.DATEPICKER,
                    identifier: "field3",
                    defaultValue: "10/12/2021",
                  },
                  field4: {
                    fieldType: FieldType.CHECKBOX,
                    identifier: "field4",
                    defaultValue: "{{sourceData.field1}}",
                  },
                  field5: {
                    fieldType: FieldType.PHONE_NUMBER_INPUT,
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

describe(".computeSchema", () => {
  it("returns LIMIT_EXCEEDED state when source data exceeds limit", () => {
    const sourceData = {
      number: 10,
      text: "text",
      object1: {
        number: 10,
        text: "text",
        obj: {
          arr: {
            number: 10,
            text: "text",
            arr: ["a", "b"],
            obj: {
              a: 10,
              c: 20,
            },
          },
        },
      },
      object2: {
        number: 10,
        text: "text",
        obj: {
          arr: {
            number: 10,
            text: "text",
            arr: ["a", "b"],
            obj: {
              a: 10,
              c: 20,
            },
          },
        },
      },
      arr2: ["1", "2"],
      arr1: [
        {
          number: 10,
          text: "text",
          obj: {
            arr: {
              number: 10,
              text: "text",
              arr: ["a", "b"],
              obj: {
                a: 10,
                c: 20,
              },
            },
          },
        },
        {
          number1: 10,
          text2: "text",
          obj: {
            arr: {
              number: 10,
              text: "text",
              arr: ["a", "b"],
              obj1: {
                a: 10,
                c: 20,
              },
            },
          },
        },
      ],
    };

    const response = computeSchema({
      currSourceData: sourceData,
      widgetName: "JSONForm1",
      fieldThemeStylesheets: {} as FieldThemeStylesheet,
    });

    expect(response.status).toEqual(ComputedSchemaStatus.LIMIT_EXCEEDED);
    expect(response.dynamicPropertyPathList).toBeUndefined();
    expect(response.schema).toEqual({});
  });

  it("returns UNCHANGED status no source data is passed", () => {
    const inputSourceData = [undefined, {}];

    inputSourceData.forEach((sourceData) => {
      const response = computeSchema({
        currSourceData: sourceData,
        widgetName: "JSONForm1",
        fieldThemeStylesheets: {} as FieldThemeStylesheet,
      });

      expect(response.status).toEqual(ComputedSchemaStatus.UNCHANGED);
      expect(response.dynamicPropertyPathList).toBeUndefined();
      expect(response.schema).toEqual({});
    });
  });

  it("returns UNCHANGED status when prev and curr source data are same", () => {
    const currSourceData = {
      obj: {
        number: 10,
        arrayOfString: ["test"],
      },
      string: "test",
    };

    const prevSourceData = {
      obj: {
        number: 10,
        arrayOfString: ["test"],
      },
      string: "test",
    };

    const response = computeSchema({
      currSourceData,
      prevSourceData,
      widgetName: "JSONForm1",
      fieldThemeStylesheets: {} as FieldThemeStylesheet,
    });

    expect(response.status).toEqual(ComputedSchemaStatus.UNCHANGED);
    expect(response.dynamicPropertyPathList).toBeUndefined();
    expect(response.schema).toEqual({});
  });

  it("returns new schema when prevSchema is not provided", () => {
    const response = computeSchema({
      currSourceData: schemaTestData.initialDataset.dataSource,
      widgetName: "JSONForm1",
      fieldThemeStylesheets: schemaTestData.fieldThemeStylesheets,
    });

    const expectedDynamicPropertyPathList = [
      { key: "schema.__root_schema__.children.dob.defaultValue" },
      { key: "schema.__root_schema__.children.boolean.defaultValue" },
    ];

    expect(response.status).toEqual(ComputedSchemaStatus.UPDATED);
    expect(response.dynamicPropertyPathList).toEqual(
      expectedDynamicPropertyPathList,
    );
    expect(response.schema).toEqual(schemaTestData.initialDataset.schemaOutput);
  });

  it("returns retains existing dynamicBindingPropertyPathList", () => {
    const existingDynamicBindingPropertyPathList = [
      { key: "dummy.path1" },
      { key: "dummy.path2" },
    ];

    const expectedDynamicPropertyPathList = [
      ...existingDynamicBindingPropertyPathList,
      { key: "schema.__root_schema__.children.dob.defaultValue" },
      { key: "schema.__root_schema__.children.boolean.defaultValue" },
    ];

    const response = computeSchema({
      currSourceData: schemaTestData.initialDataset.dataSource,
      currentDynamicPropertyPathList: existingDynamicBindingPropertyPathList,
      widgetName: "JSONForm1",
      fieldThemeStylesheets: schemaTestData.fieldThemeStylesheets,
    });

    expect(response.status).toEqual(ComputedSchemaStatus.UPDATED);
    expect(response.dynamicPropertyPathList).toEqual(
      expectedDynamicPropertyPathList,
    );
    expect(response.schema).toEqual(schemaTestData.initialDataset.schemaOutput);
  });

  it("returns updated schema when new key added to existing data source", () => {
    const existingDynamicBindingPropertyPathList = [
      { key: "dummy.path1" },
      { key: "dummy.path2" },
    ];

    const expectedDynamicPropertyPathList = [
      ...existingDynamicBindingPropertyPathList,
      { key: "schema.__root_schema__.children.dob.defaultValue" },
    ];
    const response = computeSchema({
      currSourceData:
        schemaTestData.withRemovedAddedKeyToInitialDataset.dataSource,
      prevSourceData: schemaTestData.initialDataset.dataSource,
      prevSchema: schemaTestData.initialDataset.schemaOutput,
      currentDynamicPropertyPathList: existingDynamicBindingPropertyPathList,
      widgetName: "JSONForm1",
      fieldThemeStylesheets: schemaTestData.fieldThemeStylesheets,
    });

    expect(response.status).toEqual(ComputedSchemaStatus.UPDATED);
    expect(response.dynamicPropertyPathList).toEqual(
      expectedDynamicPropertyPathList,
    );
    expect(response.schema).toEqual(
      schemaTestData.withRemovedAddedKeyToInitialDataset.schemaOutput,
    );
  });
});
