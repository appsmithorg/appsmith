import { cloneDeep, get, set } from "lodash";

import SchemaParser, {
  applyPositions,
  checkIfArrayAndSubDataTypeChanged,
  constructPlausibleObjectFromArray,
  dataTypeFor,
  fieldTypeFor,
  getKeysFromSchema,
  getSourceDataPathFromSchemaItemPath,
  getSourcePath,
  hasNullOrUndefined,
  normalizeArrayValue,
  subDataTypeFor,
} from "./schemaParser";
import testData from "./schemaTestData";
import { DataType, FieldType, Schema, SchemaItem } from "./constants";

const widgetName = "JSONForm1";

describe("#nameAndLabel", () => {
  it("returns name and transformed label", () => {
    const inputs = [
      "camelCase",
      "kebab-case",
      "PascalCase",
      "snake_case",
      "UPPER_CASE_SNAKE_CASE",
    ];

    const expectedOutputs = [
      {
        name: "camelCase",
        label: "Camel Case",
      },
      {
        name: "kebab-case",
        label: "̊Kebab Case",
      },
      {
        name: "PascalCase",
        label: "Pascal Case",
      },
      {
        name: "snake_case",
        label: "Snake Case",
      },
      {
        name: "UPPER_CASE_SNAKE_CASE",
        label: "UPPER CASE SNAKE CASE",
      },
    ];

    inputs.forEach((input, index) => {
      const result = SchemaParser.nameAndLabel(input);

      expect(expectedOutputs[index].name).toMatch(result.name);
      expect(expectedOutputs[index].label).toMatch(result.label);
    });
  });
});

describe("#parse", () => {
  it("returns a new schema for a valid data source", () => {
    const result = SchemaParser.parse(
      widgetName,
      testData.initialDataset.dataSource,
      {},
    );

    expect(result).toEqual(testData.initialDataset.schemaOutput);
  });

  it("returns an updated schema when a key removed from existing data source", () => {
    const result = SchemaParser.parse(
      widgetName,
      testData.withRemovedKeyFromInitialDataset.dataSource,
      testData.initialDataset.schemaOutput,
    );

    expect(result).toEqual(
      testData.withRemovedKeyFromInitialDataset.schemaOutput,
    );
  });

  it("returns an updated schema when new key added to existing data source", () => {
    const widgetName = "JSONForm1";

    const result = SchemaParser.parse(
      widgetName,
      testData.withRemovedAddedKeyToInitialDataset.dataSource,
      testData.initialDataset.schemaOutput,
    );

    expect(result).toEqual(
      testData.withRemovedAddedKeyToInitialDataset.schemaOutput,
    );
  });

  it("returns unmodified schema when existing field's value in data source changes to null/undefined", () => {
    const initialSchema = SchemaParser.parse(
      widgetName,
      testData.initialDataset.dataSource,
      {},
    );

    expect(initialSchema).toEqual(testData.initialDataset.schemaOutput);

    // With null field
    const nulledDataSource = cloneDeep(testData.initialDataset.dataSource);
    set(nulledDataSource, "dob", null);

    const expectedNulledSchema = cloneDeep(initialSchema);
    set(expectedNulledSchema, "__root_schema__.children.dob.sourceData", null);
    set(expectedNulledSchema, "__root_schema__.sourceData.dob", null);

    const schemaWithNulledField = SchemaParser.parse(
      widgetName,
      nulledDataSource,
      initialSchema,
    );

    expect(schemaWithNulledField).toEqual(expectedNulledSchema);

    // With undefined field
    const undefinedDataSource = cloneDeep(nulledDataSource);
    set(undefinedDataSource, "boolean", undefined);

    const expectedUndefinedSchema = cloneDeep(expectedNulledSchema);
    set(
      expectedUndefinedSchema,
      "__root_schema__.children.boolean.sourceData",
      undefined,
    );
    set(
      expectedUndefinedSchema,
      "__root_schema__.sourceData.boolean",
      undefined,
    );

    const schemaWithUndefinedField = SchemaParser.parse(
      widgetName,
      undefinedDataSource,
      schemaWithNulledField,
    );

    expect(schemaWithUndefinedField).toEqual(expectedUndefinedSchema);
  });
});

describe("#getSchemaItemByFieldType", () => {
  it("modifies schemaItem based on the fieldType provided", () => {
    const schema = testData.initialDataset.schemaOutput;
    const schemaItemPath =
      "schema.__root_schema__.children.address.children.city";
    const schemaItem = get({ schema }, schemaItemPath);

    const expectedOutput = {
      isDisabled: false,
      label: "City",
      isVisible: true,
      children: {},
      dataType: DataType.STRING,
      options: [
        { label: "Blue", value: "BLUE" },
        { label: "Green", value: "GREEN" },
        { label: "Red", value: "RED" },
      ],
      defaultValue:
        "{{((sourceData, formData, fieldState) => (sourceData.address.city))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
      fieldType: FieldType.SELECT,
      sourceData: "1",
      isCustomField: false,
      name: "city",
      identifier: "city",
      position: 1,
      serverSideFiltering: false,
      isFilterable: false,
    };

    const result = SchemaParser.getSchemaItemByFieldType(FieldType.SELECT, {
      widgetName,
      schema,
      schemaItem,
      schemaItemPath,
    });

    expect(result).toEqual(expectedOutput);
  });

  it("modifies schemaItem with updated name based on the fieldType provided", () => {
    const schema = testData.initialDataset.schemaOutput;
    const schemaItemPath =
      "schema.__root_schema__.children.address.children.city";
    const schemaItem = get({ schema }, schemaItemPath);
    schemaItem.isCustomField = true;
    schemaItem.name = "newCityName";

    const expectedOutput = {
      isDisabled: false,
      label: "City",
      isVisible: true,
      children: {},
      dataType: DataType.STRING,
      options: [
        { label: "Blue", value: "BLUE" },
        { label: "Green", value: "GREEN" },
        { label: "Red", value: "RED" },
      ],
      defaultValue: "",
      fieldType: FieldType.SELECT,
      sourceData: "",
      isCustomField: true,
      name: "newCityName",
      identifier: "city",
      position: 1,
      serverSideFiltering: false,
      isFilterable: false,
    };

    const result = SchemaParser.getSchemaItemByFieldType(FieldType.SELECT, {
      widgetName,
      schema,
      schemaItem,
      schemaItemPath,
    });

    expect(result).toEqual(expectedOutput);
  });

  it("modifies schemaItem structure when field type is changed from multiselect to flat array", () => {
    const schema = testData.initialDataset.schemaOutput;
    const schemaItemPath = "schema.__root_schema__.children.hobbies";
    const schemaItem = get({ schema }, schemaItemPath);

    const expectedOutput = {
      isDisabled: false,
      label: "Hobbies",
      isVisible: true,
      children: {
        __array_item__: {
          isDisabled: false,
          label: "Array Item",
          isVisible: true,
          children: {},
          dataType: DataType.STRING,
          defaultValue: undefined,
          fieldType: FieldType.TEXT,
          sourceData: "travelling",
          isCustomField: false,
          name: "__array_item__",
          identifier: "__array_item__",
          position: -1,
          isSpellCheck: false,
        },
      },
      dataType: DataType.ARRAY,
      defaultValue:
        "{{((sourceData, formData, fieldState) => (sourceData.hobbies))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
      fieldType: FieldType.ARRAY,
      sourceData: ["travelling", "skating", "off-roading"],
      isCustomField: false,
      name: "hobbies",
      identifier: "hobbies",
      isCollapsible: true,
      position: 4,
    };

    const result = SchemaParser.getSchemaItemByFieldType(FieldType.ARRAY, {
      widgetName,
      schema,
      schemaItem,
      schemaItemPath,
    });

    expect(result).toEqual(expectedOutput);
  });

  it("returns modified schemaItem structure when field type is changed from text to array", () => {
    const schema = testData.initialDataset.schemaOutput;
    const schemaItemPath = "schema.__root_schema__.children.name";
    const schemaItem = get({ schema }, schemaItemPath);

    const expectedOutput = {
      isDisabled: false,
      label: "Name",
      isVisible: true,
      children: {
        __array_item__: {
          isDisabled: false,
          label: "Array Item",
          isVisible: true,
          children: {},
          dataType: DataType.OBJECT,
          defaultValue: undefined,
          fieldType: FieldType.OBJECT,
          sourceData: {},
          isCustomField: false,
          name: "__array_item__",
          identifier: "__array_item__",
          position: -1,
        },
      },
      dataType: DataType.STRING,
      defaultValue:
        "{{((sourceData, formData, fieldState) => (sourceData.name))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
      fieldType: FieldType.ARRAY,
      sourceData: "Test name",
      isCustomField: false,
      name: "name",
      identifier: "name",
      isCollapsible: true,
      position: 0,
    };

    const result = SchemaParser.getSchemaItemByFieldType(FieldType.ARRAY, {
      widgetName,
      schema,
      schemaItem,
      schemaItemPath,
    });

    expect(result).toEqual(expectedOutput);
  });
});

describe("#getSchemaItemFor", () => {
  it("returns new schemaItem for a key", () => {
    const key = "firstName";

    const expectedOutput = {
      isDisabled: false,
      label: "First Name",
      isVisible: true,
      children: {},
      dataType: DataType.STRING,
      defaultValue:
        "{{((sourceData, formData, fieldState) => (sourceData.firstName))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
      fieldType: FieldType.TEXT,
      sourceData: "John",
      isCustomField: false,
      name: "firstName",
      identifier: "firstName",
      position: -1,
      isSpellCheck: false,
    };

    const result = SchemaParser.getSchemaItemFor(key, {
      widgetName,
      currSourceData: "John",
      sourceDataPath: "sourceData.firstName",
      skipDefaultValueProcessing: false,
    });

    expect(result).toEqual(expectedOutput);
  });

  it("returns new schemaItem for a custom field key", () => {
    const key = "firstName";

    const expectedOutput = {
      isDisabled: false,
      label: "First Name",
      isVisible: true,
      children: {},
      dataType: DataType.STRING,
      defaultValue: undefined,
      fieldType: FieldType.TEXT,
      sourceData: "John",
      isCustomField: true,
      name: "firstName",
      identifier: "firstName",
      position: -1,
      isSpellCheck: false,
    };

    const result = SchemaParser.getSchemaItemFor(key, {
      widgetName,
      currSourceData: "John",
      sourceDataPath: "sourceData.firstName",
      isCustomField: true,
      skipDefaultValueProcessing: false,
    });

    expect(result).toEqual(expectedOutput);
  });

  it("returns schemaItem with overridden field type", () => {
    const key = "firstName";

    const expectedOutput = {
      isDisabled: false,
      label: "First Name",
      isVisible: true,
      children: {},
      dataType: DataType.STRING,
      defaultValue: undefined,
      fieldType: FieldType.SWITCH,
      sourceData: "John",
      isCustomField: true,
      name: "firstName",
      identifier: "firstName",
      position: -1,
      alignWidget: "LEFT",
    };

    const result = SchemaParser.getSchemaItemFor(key, {
      widgetName,
      currSourceData: "John",
      sourceDataPath: "sourceData.firstName",
      isCustomField: true,
      fieldType: FieldType.SWITCH,
      skipDefaultValueProcessing: false,
    });

    expect(result).toEqual(expectedOutput);
  });

  it("returns array children only if dataType and fieldType are Array", () => {
    const key = "hobbies";

    const expectedOutput = {
      isDisabled: false,
      label: "Hobbies",
      isVisible: true,
      children: {},
      dataType: DataType.ARRAY,
      defaultValue:
        "{{((sourceData, formData, fieldState) => (sourceData.hobbies))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
      fieldType: FieldType.MULTI_SELECT,
      sourceData: ["one", "two"],
      isCustomField: false,
      name: "hobbies",
      identifier: "hobbies",
      position: -1,
      serverSideFiltering: false,
      options: [
        { label: "Blue", value: "BLUE" },
        { label: "Green", value: "GREEN" },
        { label: "Red", value: "RED" },
      ],
    };

    const result = SchemaParser.getSchemaItemFor(key, {
      widgetName,
      currSourceData: ["one", "two"],
      sourceDataPath: "sourceData.hobbies",
      skipDefaultValueProcessing: false,
    });

    expect(result).toEqual(expectedOutput);
  });
});

describe("#getUnModifiedSchemaItemFor", () => {
  it("returns unmodified schemaItem for current data", () => {
    const schemaItem = {
      isDisabled: false,
      label: "First Name",
      isVisible: true,
      children: {},
      dataType: DataType.STRING,
      defaultValue:
        "{{((sourceData, formData, fieldState) => (sourceData.firstName))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
      fieldType: FieldType.TEXT,
      sourceData: "John",
      isCustomField: false,
      name: "firstName",
      identifier: "firstName",
      position: -1,
      isSpellCheck: false,
    };
    const currData = "John";
    const sourceDataPath = "sourceData.firstName";

    const result = SchemaParser.getUnModifiedSchemaItemFor({
      currSourceData: currData,
      schemaItem,
      sourceDataPath,
      widgetName,
      skipDefaultValueProcessing: false,
    });

    expect(result).toEqual(schemaItem);
  });

  it("returns array children only if dataType and fieldType are Array", () => {
    const schemaItem = {
      isDisabled: false,
      label: "Hobbies",
      isVisible: true,
      children: {},
      dataType: DataType.ARRAY,
      defaultValue:
        "{{((sourceData, formData, fieldState) => (sourceData.hobbies))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
      fieldType: FieldType.MULTI_SELECT,
      sourceData: "John",
      isCustomField: false,
      name: "hobbies",
      identifier: "hobbies",
      position: -1,
      serverSideFiltering: false,
      options: [
        { label: "Blue", value: "BLUE" },
        { label: "Green", value: "GREEN" },
        { label: "Red", value: "RED" },
      ],
    };

    const currData = "John";
    const sourceDataPath = "sourceData.firstName";

    const result = SchemaParser.getUnModifiedSchemaItemFor({
      currSourceData: currData,
      schemaItem,
      sourceDataPath,
      widgetName,
      skipDefaultValueProcessing: false,
    });

    expect(result).toEqual(schemaItem);
  });
});

describe("#convertArrayToSchema", () => {
  it("returns schema for array data", () => {
    const currSourceData = [
      {
        firstName: "John",
      },
    ];

    const expectedSchema = {
      __array_item__: {
        isDisabled: false,
        label: "Array Item",
        isVisible: true,
        children: {
          firstName: {
            isDisabled: false,
            label: "First Name",
            isVisible: true,
            children: {},
            dataType: DataType.STRING,
            defaultValue: undefined,
            fieldType: FieldType.TEXT,
            sourceData: "John",
            isCustomField: false,
            name: "firstName",
            identifier: "firstName",
            position: 0,
            isSpellCheck: false,
          },
        },
        dataType: DataType.OBJECT,
        defaultValue: undefined,
        fieldType: FieldType.OBJECT,
        sourceData: {
          firstName: "John",
        },
        isCustomField: false,
        name: "__array_item__",
        identifier: "__array_item__",
        position: -1,
      },
    };

    const result = SchemaParser.convertArrayToSchema({
      currSourceData,
      widgetName,
      sourceDataPath: "sourceData.entries",
      skipDefaultValueProcessing: false,
    });

    expect(result).toEqual(expectedSchema);
  });

  it("returns modified schema with only modified updates when data changes", () => {
    const currSourceData = [
      {
        firstName: "John",
        lastName: "Doe",
      },
    ];

    const prevSchema = {
      __array_item__: {
        isDisabled: false,
        label: "Array Item",
        isVisible: false,
        children: {
          firstName: {
            isDisabled: false,
            label: "First Name",
            isVisible: true,
            children: {},
            dataType: DataType.STRING,
            defaultValue: "Modified default value",
            fieldType: FieldType.TEXT,
            sourceData: "John",
            isCustomField: false,
            name: "name",
            identifier: "firstName",
            position: 0,
            isSpellCheck: true,
            isRequired: true,
          },
        },
        dataType: DataType.OBJECT,
        defaultValue:
          "{{((sourceData, formData, fieldState) => (sourceData.entries[0]))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
        fieldType: FieldType.OBJECT,
        sourceData: {
          firstName: "John",
        },
        isCustomField: false,
        name: "__array_item__",
        identifier: "__array_item__",
        position: -1,
      },
    };

    const expectedSchema = {
      __array_item__: {
        isDisabled: false,
        label: "Array Item",
        isVisible: false,
        children: {
          firstName: {
            isDisabled: false,
            label: "First Name",
            isVisible: true,
            children: {},
            dataType: DataType.STRING,
            defaultValue: "Modified default value",
            fieldType: FieldType.TEXT,
            sourceData: "John",
            isCustomField: false,
            name: "name",
            identifier: "firstName",
            position: 0,
            isSpellCheck: true,
            isRequired: true,
          },
          lastName: {
            isDisabled: false,
            label: "Last Name",
            isVisible: true,
            children: {},
            dataType: DataType.STRING,
            defaultValue: undefined,
            fieldType: FieldType.TEXT,
            sourceData: "Doe",
            isCustomField: false,
            name: "lastName",
            identifier: "lastName",
            position: 1,
            isSpellCheck: false,
          },
        },
        dataType: DataType.OBJECT,
        defaultValue:
          "{{((sourceData, formData, fieldState) => (sourceData.entries[0]))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
        fieldType: FieldType.OBJECT,
        sourceData: {
          firstName: "John",
          lastName: "Doe",
        },
        isCustomField: false,
        name: "__array_item__",
        identifier: "__array_item__",
        position: -1,
      },
    };

    const result = SchemaParser.convertArrayToSchema({
      currSourceData,
      widgetName,
      sourceDataPath: "sourceData.entries",
      prevSchema,
      skipDefaultValueProcessing: false,
    });

    expect(result).toEqual(expectedSchema);
  });
});

describe("#convertObjectToSchema", () => {
  it("returns schema for object data", () => {
    const currSourceData = {
      firstName: "John",
    };

    const expectedSchema = {
      firstName: {
        isDisabled: false,
        label: "First Name",
        isVisible: true,
        children: {},
        dataType: DataType.STRING,
        defaultValue:
          "{{((sourceData, formData, fieldState) => (sourceData.entry.firstName))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
        fieldType: FieldType.TEXT,
        sourceData: "John",
        isCustomField: false,
        name: "firstName",
        identifier: "firstName",
        position: 0,
        isSpellCheck: false,
      },
    };

    const result = SchemaParser.convertObjectToSchema({
      currSourceData,
      widgetName,
      sourceDataPath: "sourceData.entry",
      skipDefaultValueProcessing: false,
    });

    expect(result).toEqual(expectedSchema);
  });

  it("returns modified schema with only modified updates when data changes", () => {
    const currSourceData = {
      firstName: "John",
      lastName: "Doe",
    };

    const prevSchema = {
      firstName: {
        isDisabled: false,
        label: "First Name",
        isVisible: true,
        children: {},
        dataType: DataType.STRING,
        defaultValue: "Modified default value",
        fieldType: FieldType.TEXT,
        sourceData: "John",
        isCustomField: false,
        name: "name",
        identifier: "firstName",
        position: 0,
        isSpellCheck: true,
        isRequired: true,
      },
    };

    const expectedSchema = {
      firstName: {
        isDisabled: false,
        label: "First Name",
        isVisible: true,
        children: {},
        dataType: DataType.STRING,
        defaultValue: "Modified default value",
        fieldType: FieldType.TEXT,
        sourceData: "John",
        isCustomField: false,
        name: "name",
        identifier: "firstName",
        position: 0,
        isSpellCheck: true,
        isRequired: true,
      },
      lastName: {
        isDisabled: false,
        label: "Last Name",
        isVisible: true,
        children: {},
        dataType: DataType.STRING,
        defaultValue:
          "{{((sourceData, formData, fieldState) => (sourceData.entries.lastName))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
        fieldType: FieldType.TEXT,
        sourceData: "Doe",
        isCustomField: false,
        name: "lastName",
        identifier: "lastName",
        position: 1,
        isSpellCheck: false,
      },
    };

    const result = SchemaParser.convertObjectToSchema({
      currSourceData,
      widgetName,
      sourceDataPath: "sourceData.entries",
      prevSchema,
      skipDefaultValueProcessing: false,
    });

    expect(result).toEqual(expectedSchema);
  });
});

describe(".constructPlausibleObjectFromArray", () => {
  it("returns an object from array of objects", () => {
    const input = [
      { firstName: "20" },
      { lastName: 30 },
      { lastName: 20, addresses: [{ line1: "line1" }] },
    ];

    const expectedOutput = {
      firstName: "20",
      lastName: 20,
      addresses: [{ line1: "line1" }],
    };

    const result = constructPlausibleObjectFromArray(input);

    expect(result).toEqual(expectedOutput);
  });
});

describe(".getSourcePath", () => {
  it("returns path with object notation when name is string", () => {
    const input = "test";
    const basePath = "sourceData.obj";

    const resultWithBasePath = getSourcePath(input, basePath);
    const resultWithoutBasePath = getSourcePath(input);

    expect(resultWithBasePath).toMatch("sourceData.obj.test");
    expect(resultWithoutBasePath).toMatch("test");
  });

  it("returns path with array notation when name is number", () => {
    const input = 0;
    const basePath = "sourceData.arr";

    const resultWithBasePath = getSourcePath(input, basePath);
    const resultWithoutBasePath = getSourcePath(input);

    expect(resultWithBasePath).toMatch("sourceData.arr[0]");
    expect(resultWithoutBasePath).toMatch("[0]");
  });
});

describe(".getSourceDataPathFromSchemaItemPath", () => {
  it("returns source data path from schema item path", () => {
    const inputs = [
      "schema.__root_schema__.children.name",
      "schema.__root_schema__.children.education.children.__array_item__.children.college",
      "schema.__root_schema__.children.address.children.Line1",
    ];

    const expectedOutputs = [
      "sourceData.name",
      "sourceData.education[0].college",
      "sourceData.address.Line1",
    ];

    inputs.forEach((input, index) => {
      const result = getSourceDataPathFromSchemaItemPath(
        testData.initialDataset.schemaOutput,
        input,
      );

      expect(result).toMatch(expectedOutputs[index]);
    });
  });
});

describe(".dataTypeFor", () => {
  it("returns data type or the passed data", () => {
    const inputs = [
      "string",
      10,
      [],
      null,
      undefined,
      {},
      () => {
        10;
      },
    ];

    const expectedOutputs = [
      DataType.STRING,
      DataType.NUMBER,
      DataType.ARRAY,
      DataType.NULL,
      DataType.UNDEFINED,
      DataType.OBJECT,
      DataType.FUNCTION,
    ];

    inputs.forEach((input, index) => {
      const result = dataTypeFor(input);

      expect(result).toEqual(expectedOutputs[index]);
    });
  });
});

describe(".subDataTypeFor", () => {
  it("return sub data type of data passed", () => {
    const inputs = [
      "string",
      10,
      [{}],
      [""],
      [1],
      [null],
      null,
      undefined,
      { foo: "" },
      () => {
        10;
      },
    ];

    const expectedOutputs = [
      undefined,
      undefined,
      DataType.OBJECT,
      DataType.STRING,
      DataType.NUMBER,
      DataType.NULL,
      undefined,
      undefined,
      undefined,
      undefined,
    ];

    inputs.forEach((input, index) => {
      const result = subDataTypeFor(input);

      expect(result).toEqual(expectedOutputs[index]);
    });
  });
});

describe(".normalizeArrayValue", () => {
  it("returns returns normalized sub value of an array", () => {
    const inputs = [[""], [1, 2], [{ firstName: 10 }], [], [null]];

    const expectedOutputs = ["", 1, { firstName: 10 }, undefined, null];

    inputs.forEach((input, index) => {
      const result = normalizeArrayValue(input);

      expect(result).toEqual(expectedOutputs[index]);
    });
  });
});

describe(".fieldTypeFor", () => {
  it("return default field type of data passed", () => {
    const inputAndExpectedOutputs: [any, FieldType][] = [
      ["string", FieldType.TEXT],
      ["2021-12-30T10:36:12.1212+05:30", FieldType.DATE],
      ["December 30, 2021 10:36 AM", FieldType.DATE],
      ["December 30, 2021", FieldType.DATE],
      ["2021-12-30 10:36", FieldType.DATE],
      ["2021-12-30T10:36:12", FieldType.DATE],
      ["2021-12-30 10:36:12 AM", FieldType.DATE],
      ["30/12/2021 10:36", FieldType.DATE],
      ["30 December, 2021", FieldType.DATE],
      ["10:36 AM 30 December, 2021", FieldType.DATE],
      ["2021-12-30", FieldType.DATE],
      ["12-30-2021", FieldType.DATE],
      ["30-12-2021", FieldType.DATE],
      ["12/30/2021", FieldType.DATE],
      ["30/12/2021", FieldType.DATE],
      ["30/12/21", FieldType.DATE],
      ["12/30/21", FieldType.DATE],
      ["40/10/40", FieldType.TEXT],
      ["2000/10", FieldType.TEXT],
      ["1", FieldType.TEXT],
      ["#111", FieldType.TEXT],
      ["999", FieldType.TEXT],
      ["test@demo.com", FieldType.EMAIL],
      ["test@.com", FieldType.TEXT],
      [10, FieldType.NUMBER],
      [[{}], FieldType.ARRAY],
      [[""], FieldType.MULTI_SELECT],
      [[1], FieldType.MULTI_SELECT],
      [[null], FieldType.MULTI_SELECT],
      [null, FieldType.TEXT],
      [undefined, FieldType.TEXT],
      [{ foo: "" }, FieldType.OBJECT],
      [
        () => {
          10;
        },
        FieldType.TEXT,
      ],
    ];

    inputAndExpectedOutputs.forEach(([input, expectedOutput]) => {
      const result = fieldTypeFor(input);

      expect(result).toEqual(expectedOutput);
    });
  });
});

describe(".getKeysFromSchema", () => {
  it("return all the first level keys in a schema which are not custom", () => {
    const expectedOutput = [
      "name",
      "age",
      "dob",
      "boolean",
      "hobbies",
      "education",
      "address",
    ];

    const result = getKeysFromSchema(
      testData.initialDataset.schemaOutput.__root_schema__.children,
    );

    expect(result).toEqual(expectedOutput);
  });

  it("return empty array for empty schema", () => {
    const result = getKeysFromSchema({});

    expect(result).toEqual([]);
  });

  it("return keys and skips custom field keys", () => {
    const schema = cloneDeep(
      testData.initialDataset.schemaOutput.__root_schema__.children,
    );

    schema.name.isCustomField = true;

    const expectedOutput = [
      "age",
      "dob",
      "boolean",
      "hobbies",
      "education",
      "address",
    ];

    const result = getKeysFromSchema(schema);

    expect(result).toEqual(expectedOutput);
  });
});

describe("#applyPositions", () => {
  it("applies positions to new keys added to the schema ", () => {
    const schema = cloneDeep<Schema>(
      testData.initialDataset.schemaOutput.__root_schema__.children,
    );

    schema["firstNewField"] = {
      position: -1,
    } as SchemaItem;
    schema["secondNewField"] = {
      position: -1,
    } as SchemaItem;

    const newKeys = ["firstNewField", "secondNewField"];

    applyPositions(schema, newKeys);

    expect(schema.name.position).toEqual(0);
    expect(schema.age.position).toEqual(1);
    expect(schema.dob.position).toEqual(2);
    expect(schema.boolean.position).toEqual(3);
    expect(schema.hobbies.position).toEqual(4);
    expect(schema.education.position).toEqual(5);
    expect(schema.address.position).toEqual(6);
    expect(schema.firstNewField.position).toEqual(7);
    expect(schema.secondNewField.position).toEqual(8);
  });

  it("repositions any when keys are deleted only when new keys added to the schema ", () => {
    const schema = cloneDeep<Schema>(
      testData.initialDataset.schemaOutput.__root_schema__.children,
    );

    schema["firstNewField"] = {
      position: -1,
    } as SchemaItem;
    schema["secondNewField"] = {
      position: -1,
    } as SchemaItem;

    delete schema.education;
    delete schema.dob;

    const newKeys = ["firstNewField", "secondNewField"];

    applyPositions(schema, newKeys);

    expect(schema.name.position).toEqual(0);
    expect(schema.age.position).toEqual(1);
    expect(schema.boolean.position).toEqual(2);
    expect(schema.hobbies.position).toEqual(3);
    expect(schema.address.position).toEqual(4);
    expect(schema.firstNewField.position).toEqual(5);
    expect(schema.secondNewField.position).toEqual(6);

    expect(schema.dob).toBeUndefined();
    expect(schema.education).toBeUndefined();
  });
});

describe(".checkIfArrayAndSubDataTypeChanged", () => {
  it("return true if passed data is array and it's sub value type changed", () => {
    const currData = [{}];
    const prevData = [""];

    const result = checkIfArrayAndSubDataTypeChanged(currData, prevData);

    expect(result).toEqual(true);
  });

  it("return true if passed data is array and it's sub value type changed", () => {
    const currData = [{}];
    const prevData = [{}];

    const result = checkIfArrayAndSubDataTypeChanged(currData, prevData);

    expect(result).toEqual(false);
  });
});

describe(".hasNullOrUndefined", () => {
  it("returns false when one of the parameter is null or undefined", () => {
    const inputAndExpectedOutputs: [[any, any], boolean][] = [
      [["1", "2"], false],
      [[0, ""], false],
      [[undefined, "2"], true],
      [[undefined, null], true],
      [[undefined, undefined], true],
      [[null, null], true],
      [[null, "null"], true],
      [["null", "null"], false],
      [["undefined", "undefined"], false],
      [[0, 0], false],
      [["", ""], false],
    ];

    inputAndExpectedOutputs.forEach(([input, expectedOutput]) => {
      const result = hasNullOrUndefined(input);
      expect(result).toEqual(expectedOutput);
    });
  });
});
