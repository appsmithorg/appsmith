import {
  ARRAY_ITEM_KEY,
  DataType,
  FieldType,
  ROOT_SCHEMA_KEY,
  Schema,
  SchemaItem,
} from "./constants";
import {
  convertSchemaItemToFormData,
  countFields,
  mergeAllObjectsInAnArray,
  schemaItemDefaultValue,
  validateOptions,
} from "./helper";

describe(".schemaItemDefaultValue", () => {
  it("returns array default value when sub array fields don't have default value", () => {
    const schemaItem = ({
      accessor: "education",
      identifier: "education",
      originalIdentifier: "education",
      dataType: DataType.ARRAY,
      fieldType: FieldType.ARRAY,
      isVisible: true,
      defaultValue: [
        {
          college: "String field",
          graduationDate: "10/12/2021",
        },
      ],
      children: {
        __array_item__: {
          identifier: ARRAY_ITEM_KEY,
          originalIdentifier: ARRAY_ITEM_KEY,
          dataType: DataType.OBJECT,
          fieldType: FieldType.OBJECT,
          defaultValue: undefined,
          isVisible: true,
          children: {
            college: {
              label: "College",
              children: {},
              isVisible: true,
              dataType: DataType.STRING,
              defaultValue: undefined,
              fieldType: FieldType.TEXT_INPUT,
              accessor: "college",
              identifier: "college",
              originalIdentifier: "college",
            },
            graduationDate: {
              children: {},
              isVisible: true,
              dataType: DataType.STRING,
              defaultValue: undefined,
              fieldType: FieldType.DATEPICKER,
              accessor: "graduationDate",
              identifier: "graduationDate",
              originalIdentifier: "graduationDate",
            },
          },
        },
      },
    } as unknown) as SchemaItem;

    const expectedDefaultValue = [
      {
        college: "String field",
        graduationDate: "10/12/2021",
      },
    ];

    const result = schemaItemDefaultValue(schemaItem, "identifier");

    expect(result).toEqual(expectedDefaultValue);
  });

  it("returns array default value when sub array fields don't have default value with accessor keys", () => {
    const schemaItem = ({
      accessor: "education 1",
      identifier: "education",
      originalIdentifier: "education",
      dataType: DataType.ARRAY,
      fieldType: FieldType.ARRAY,
      isVisible: true,
      defaultValue: [
        {
          college: "String field",
          graduationDate: "10/12/2021",
        },
      ],
      children: {
        __array_item__: {
          identifier: ARRAY_ITEM_KEY,
          originalIdentifier: ARRAY_ITEM_KEY,
          dataType: DataType.OBJECT,
          fieldType: FieldType.OBJECT,
          defaultValue: undefined,
          isVisible: true,
          children: {
            college: {
              label: "College",
              children: {},
              dataType: DataType.STRING,
              defaultValue: undefined,
              fieldType: FieldType.TEXT_INPUT,
              accessor: "graduating college",
              identifier: "college",
              originalIdentifier: "college",
              isVisible: true,
            },
            graduationDate: {
              children: {},
              dataType: DataType.STRING,
              defaultValue: undefined,
              fieldType: FieldType.DATEPICKER,
              accessor: "graduation date",
              identifier: "graduationDate",
              originalIdentifier: "graduationDate",
              isVisible: true,
            },
          },
        },
      },
    } as unknown) as SchemaItem;

    const expectedDefaultValue = [
      {
        "graduating college": "String field",
        "graduation date": "10/12/2021",
      },
    ];

    const result = schemaItemDefaultValue(schemaItem, "accessor");

    expect(result).toEqual(expectedDefaultValue);
  });

  it("returns merged default value when sub array fields have default value", () => {
    const schemaItem = ({
      name: "education",
      accessor: "education",
      identifier: "education",
      originalIdentifier: "education",
      dataType: DataType.ARRAY,
      fieldType: FieldType.ARRAY,
      isVisible: true,
      defaultValue: [
        {
          college: "String field",
          graduationDate: "10/12/2021",
        },
      ],
      children: {
        __array_item__: {
          accessor: ARRAY_ITEM_KEY,
          identifier: ARRAY_ITEM_KEY,
          originalIdentifier: ARRAY_ITEM_KEY,
          dataType: DataType.OBJECT,
          fieldType: FieldType.OBJECT,
          defaultValue: {
            college: "String field",
            graduationDate: "10/12/2021",
          },
          isVisible: true,
          children: {
            college: {
              label: "College",
              children: {},
              dataType: DataType.STRING,
              defaultValue: "Some college name",
              fieldType: FieldType.TEXT_INPUT,
              accessor: "college",
              identifier: "college",
              originalIdentifier: "college",
              isVisible: true,
            },
            graduationDate: {
              children: {},
              dataType: DataType.STRING,
              defaultValue: undefined,
              fieldType: FieldType.DATEPICKER,
              accessor: "graduationDate",
              identifier: "graduationDate",
              originalIdentifier: "graduationDate",
              isVisible: true,
            },
          },
        },
      },
    } as unknown) as SchemaItem;

    const expectedDefaultValue = [
      {
        college: "String field",
        graduationDate: "10/12/2021",
      },
    ];

    const result = schemaItemDefaultValue(schemaItem, "identifier");

    expect(result).toEqual(expectedDefaultValue);
  });

  it("returns merged default value when array field has default value more than one item", () => {
    const schemaItem = ({
      name: "education",
      accessor: "education",
      identifier: "education",
      originalIdentifier: "education",
      dataType: DataType.ARRAY,
      fieldType: FieldType.ARRAY,
      defaultValue: [
        {
          college: "String field 1",
          graduationDate: "10/12/2021",
        },
        {
          college: "String field 2",
          graduationDate: "30/12/2021",
        },
      ],
      children: {
        __array_item__: {
          accessor: ARRAY_ITEM_KEY,
          identifier: ARRAY_ITEM_KEY,
          originalIdentifier: ARRAY_ITEM_KEY,
          dataType: DataType.OBJECT,
          fieldType: FieldType.OBJECT,
          isVisible: true,
          defaultValue: {
            college: "String field",
            graduationDate: "10/12/2021",
          },
          children: {
            college: {
              label: "College",
              children: {},
              dataType: DataType.STRING,
              defaultValue: "Some college name",
              fieldType: FieldType.TEXT_INPUT,
              accessor: "college",
              identifier: "college",
              originalIdentifier: "college",
              isVisible: true,
            },
            graduationDate: {
              children: {},
              dataType: DataType.STRING,
              defaultValue: undefined,
              fieldType: FieldType.DATEPICKER,
              accessor: "graduationDate",
              identifier: "graduationDate",
              originalIdentifier: "graduationDate",
              isVisible: true,
            },
          },
        },
      },
    } as unknown) as SchemaItem;

    const expectedDefaultValue = [
      {
        college: "String field 1",
        graduationDate: "10/12/2021",
      },
      {
        college: "String field 2",
        graduationDate: "30/12/2021",
      },
    ];

    const result = schemaItemDefaultValue(schemaItem, "identifier");

    expect(result).toEqual(expectedDefaultValue);
  });

  it("returns only sub array fields default value, when array level default value is empty", () => {
    const schemaItem = ({
      accessor: "education",
      identifier: "education",
      originalIdentifier: "education",
      dataType: DataType.ARRAY,
      fieldType: FieldType.ARRAY,
      defaultValue: undefined,
      children: {
        __array_item__: {
          accessor: ARRAY_ITEM_KEY,
          identifier: ARRAY_ITEM_KEY,
          originalIdentifier: ARRAY_ITEM_KEY,
          dataType: DataType.OBJECT,
          fieldType: FieldType.OBJECT,
          defaultValue: undefined,
          children: {
            college: {
              label: "College",
              children: {},
              dataType: DataType.STRING,
              defaultValue: "Some college name",
              fieldType: FieldType.TEXT_INPUT,
              accessor: "college",
              identifier: "college",
              originalIdentifier: "college",
            },
            graduationDate: {
              children: {},
              dataType: DataType.STRING,
              defaultValue: "10/10/2001",
              fieldType: FieldType.DATEPICKER,
              accessor: "graduationDate",
              identifier: "graduationDate",
              originalIdentifier: "graduationDate",
            },
          },
        },
      },
    } as unknown) as SchemaItem;

    const expectedDefaultValue = [
      {
        college: "Some college name",
        graduationDate: "10/10/2001",
      },
    ];

    const result = schemaItemDefaultValue(schemaItem, "identifier");

    expect(result).toEqual(expectedDefaultValue);
  });

  it("returns valid default value when non compliant keys in default value is present", () => {
    const schemaItem = ({
      accessor: "education",
      identifier: "education",
      originalIdentifier: "education",
      dataType: DataType.ARRAY,
      fieldType: FieldType.ARRAY,
      defaultValue: [
        {
          "graduating college": "Some college name",
          "graduation date": "10/10/2001",
        },
      ],
      children: {
        __array_item__: {
          accessor: ARRAY_ITEM_KEY,
          identifier: ARRAY_ITEM_KEY,
          originalIdentifier: ARRAY_ITEM_KEY,
          dataType: DataType.OBJECT,
          fieldType: FieldType.OBJECT,
          defaultValue: undefined,
          isVisible: true,
          children: {
            graduating_college: {
              label: "College",
              children: {},
              dataType: DataType.STRING,
              defaultValue: undefined,
              fieldType: FieldType.TEXT_INPUT,
              accessor: "college",
              identifier: "graduating_college",
              originalIdentifier: "graduating college",
              isVisible: true,
            },
            graduation_date: {
              children: {},
              dataType: DataType.STRING,
              defaultValue: undefined,
              fieldType: FieldType.DATEPICKER,
              accessor: "newDate",
              identifier: "graduation_date",
              originalIdentifier: "graduation date",
              isVisible: true,
            },
          },
        },
      },
    } as unknown) as SchemaItem;

    const expectedDefaultValue = [
      {
        college: "Some college name",
        newDate: "10/10/2001",
      },
    ];

    const result = schemaItemDefaultValue(schemaItem, "identifier");

    expect(result).toEqual(expectedDefaultValue);
  });
});

describe(".validateOptions", () => {
  it("returns values passed for valid values", () => {
    const inputAndExpectedOutput = [
      [[""], true],
      [[0], true],
      [[true], true],
      [[false], true],
      [[{}, ""], false],
      [[{}, null], false],
      [[{}, undefined], false],
      [[{}, NaN], false],
      [["test", null], false],
      [["test", undefined], false],
      [["test", NaN], false],
      [["", null], false],
      [["", undefined], false],
      [["", NaN], false],
      [[0, null], false],
      [[0, undefined], false],
      [[0, NaN], false],
      [[1, null], false],
      [[1, undefined], false],
      [[1, NaN], false],
      [[{ label: "", value: "" }], true],
      [[{ label: "", value: "" }, { label: "" }], false],
      [{ label: "", value: "" }, false],
      ["label", false],
      [1, false],
      [null, false],
      [undefined, false],
      [NaN, false],
      [["one", "two"], true],
      [[1, 2], true],
    ];

    inputAndExpectedOutput.forEach(([input, expectedOutput]) => {
      const result = validateOptions(input);

      expect(result).toEqual(expectedOutput);
    });
  });
});

describe(".mergeAllObjectsInAnArray", () => {
  it("returns merged array", () => {
    const input = [
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
    ];

    const expectedOutput = {
      number: 10,
      text: "text",
      number1: 10,
      text2: "text",
      obj: {
        arr: {
          number: 10,
          text: "text",
          arr: ["a", "b"],
          obj: {
            a: 10,
            c: 20,
          },
          obj1: {
            a: 10,
            c: 20,
          },
        },
      },
    };

    const result = mergeAllObjectsInAnArray(input);

    expect(result).toEqual(expectedOutput);
  });
});

describe(".countFields", () => {
  it("return number of fields in an object", () => {
    const inputAndExpectedOutput = [
      { input: { foo: { bar: 10 } }, expectedOutput: 2 },
      { input: { foo: { bar: 10 }, arr: ["1", "2", "3"] }, expectedOutput: 3 },
      {
        input: {
          foo: { bar: 10 },
          arr: ["1", "2", "3"],
          arr1: [{ a: 10 }, { c: 10, d: { e: 20, k: ["a", "b"] } }],
        },
        expectedOutput: 14,
      },
      {
        input: {
          number: 10,
          text: "text",
          arr: {
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
        },
        expectedOutput: 45,
      },
    ];

    inputAndExpectedOutput.forEach(({ expectedOutput, input }) => {
      const result = countFields(input);

      expect(result).toEqual(expectedOutput);
    });
  });
});

describe(".convertSchemaItemToFormData", () => {
  const schema = ({
    __root_schema__: {
      children: {
        customField1: {
          children: {},
          dataType: DataType.STRING,
          fieldType: FieldType.TEXT_INPUT,
          accessor: "gender",
          identifier: "customField1",
          originalIdentifier: "customField1",
          isVisible: true,
        },
        customField2: {
          children: {},
          dataType: DataType.STRING,
          fieldType: FieldType.TEXT_INPUT,
          accessor: "age",
          identifier: "customField2",
          originalIdentifier: "customField2",
          isVisible: false,
        },
        array: {
          children: {
            __array_item__: {
              children: {
                name: {
                  dataType: DataType.STRING,
                  fieldType: FieldType.TEXT_INPUT,
                  accessor: "firstName",
                  identifier: "name",
                  originalIdentifier: "name",
                  isVisible: true,
                },
                date: {
                  dataType: DataType.STRING,
                  fieldType: FieldType.TEXT_INPUT,
                  accessor: "graduationDate",
                  identifier: "date",
                  originalIdentifier: "date",
                  isVisible: false,
                },
              },
              dataType: DataType.OBJECT,
              fieldType: FieldType.OBJECT,
              accessor: ARRAY_ITEM_KEY,
              identifier: ARRAY_ITEM_KEY,
              originalIdentifier: ARRAY_ITEM_KEY,
              isVisible: true,
            },
          },
          dataType: DataType.ARRAY,
          fieldType: FieldType.ARRAY,
          accessor: "students",
          identifier: "array",
          originalIdentifier: "array",
          isVisible: true,
        },
        hiddenArray: {
          children: {
            __array_item__: {
              children: {
                name: {
                  dataType: DataType.STRING,
                  fieldType: FieldType.TEXT_INPUT,
                  accessor: "firstName",
                  identifier: "name",
                  originalIdentifier: "name",
                  isVisible: true,
                },
              },
              dataType: DataType.OBJECT,
              fieldType: FieldType.OBJECT,
              accessor: ARRAY_ITEM_KEY,
              identifier: ARRAY_ITEM_KEY,
              originalIdentifier: ARRAY_ITEM_KEY,
              isVisible: true,
            },
          },
          dataType: DataType.ARRAY,
          fieldType: FieldType.ARRAY,
          accessor: "testHiddenArray",
          identifier: "hiddenArray",
          originalIdentifier: "hiddenArray",
          isVisible: false,
        },
        visibleObject: {
          children: {
            name: {
              dataType: DataType.STRING,
              fieldType: FieldType.TEXT_INPUT,
              accessor: "firstName",
              identifier: "name",
              originalIdentifier: "name",
              isVisible: true,
            },
            date: {
              dataType: DataType.STRING,
              fieldType: FieldType.TEXT_INPUT,
              accessor: "graduationDate",
              identifier: "date",
              originalIdentifier: "date",
              isVisible: false,
            },
          },
          dataType: DataType.OBJECT,
          fieldType: FieldType.OBJECT,
          accessor: "testVisibleObject",
          identifier: "visibleObject",
          originalIdentifier: "visibleObject",
          isVisible: true,
        },
        hiddenObject: {
          children: {
            name: {
              dataType: DataType.STRING,
              fieldType: FieldType.TEXT_INPUT,
              accessor: "firstName",
              identifier: "name",
              originalIdentifier: "name",
              isVisible: true,
            },
            date: {
              dataType: DataType.STRING,
              fieldType: FieldType.TEXT_INPUT,
              accessor: "graduationDate",
              identifier: "date",
              originalIdentifier: "date",
              isVisible: false,
            },
          },
          dataType: DataType.OBJECT,
          fieldType: FieldType.OBJECT,
          accessor: "testHiddenObject",
          identifier: "hiddenObject",
          originalIdentifier: "hiddenObject",
          isVisible: false,
        },
      },
      dataType: DataType.OBJECT,
      fieldType: FieldType.OBJECT,
      accessor: "",
      identifier: "",
      originalIdentifier: "",
      isVisible: true,
    },
  } as unknown) as Schema;

  it("replaces data with accessor keys to identifier keys", () => {
    const formData = {
      gender: "male",
      age: "20",
      students: [
        { firstName: "test1", graduationDate: "10/12/2010" },
        { firstName: "test2", graduationDate: "14/02/2010" },
      ],
      testHiddenArray: [{ firstName: "test1" }, { firstName: "test2" }],
      testVisibleObject: { firstName: "test1", graduationDate: "10/12/2010" },
      testHiddenObject: { firstName: "test1", graduationDate: "10/12/2010" },
    };

    const expectedOutput = {
      customField1: "male",
      array: [{ name: "test1" }, { name: "test2" }],
      visibleObject: { name: "test1" },
    };

    const result = convertSchemaItemToFormData(
      schema[ROOT_SCHEMA_KEY],
      formData,
      { fromId: "accessor", toId: "identifier" },
    );

    expect(result).toEqual(expectedOutput);
  });

  it("replaces data with identifier keys to accessor keys", () => {
    const formData = {
      customField1: "male",
      customField2: "demo",
      array: [{ name: "test1" }, { name: "test2" }],
      hiddenArray: [{ name: "test1" }, { name: "test2" }],
      visibleObject: { name: "test1", date: "10/12/2010" },
      hiddenObject: { name: "test1", date: "10/12/2010" },
    };

    const expectedOutput = {
      gender: "male",
      students: [{ firstName: "test1" }, { firstName: "test2" }],
      testVisibleObject: { firstName: "test1" },
    };

    const result = convertSchemaItemToFormData(
      schema[ROOT_SCHEMA_KEY],
      formData,
      { fromId: "identifier", toId: "accessor" },
    );

    expect(result).toEqual(expectedOutput);
  });

  it("replaces data with identifier keys to accessor keys when keys are missing", () => {
    const formData = {
      customField1: "male",
      customField2: "demo1",
      customField3: "demo2",
      hiddenArray: [{ name: "test1" }, { name: "test2" }],
      visibleObject: { name: "test1", date: "10/12/2010" },
      hiddenObject: { name: "test1", date: "10/12/2010" },
    };

    const expectedOutput = {
      gender: "male",
      testVisibleObject: { firstName: "test1" },
    };

    const result = convertSchemaItemToFormData(
      schema[ROOT_SCHEMA_KEY],
      formData,
      { fromId: "identifier", toId: "accessor" },
    );

    expect(result).toEqual(expectedOutput);
  });

  it("replaces data with identifier keys to accessor keys when keys are undefined", () => {
    const formData = {
      customField1: "male",
      customField2: "demo",
      array: [{ name: "test1" }, { name: undefined }],
      hiddenArray: [{ name: "test1" }, { name: "test2" }],
      visibleObject: { name: "test1", date: "10/12/2010" },
      hiddenObject: { name: "test1", date: "10/12/2010" },
    };

    const expectedOutput = {
      gender: "male",
      students: [{ firstName: "test1" }, { firstName: undefined }],
      testVisibleObject: { firstName: "test1" },
    };

    const result = convertSchemaItemToFormData(
      schema[ROOT_SCHEMA_KEY],
      formData,
      { fromId: "identifier", toId: "accessor" },
    );

    expect(result).toEqual(expectedOutput);
  });
});
