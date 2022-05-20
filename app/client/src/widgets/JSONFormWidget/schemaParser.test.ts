import { get, set } from "lodash";
import { klona } from "klona";

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
import {
  ARRAY_ITEM_KEY,
  DataType,
  FieldType,
  Schema,
  SchemaItem,
} from "./constants";

const widgetName = "JSONForm1";

describe("#parse", () => {
  it("returns a new schema for a valid data source", () => {
    const result = SchemaParser.parse(widgetName, {
      currSourceData: testData.initialDataset.dataSource,
      schema: {},
      fieldThemeStylesheets: testData.fieldThemeStylesheets,
    });

    expect(result).toEqual(testData.initialDataset.schemaOutput);
  });

  it("returns an updated schema when a key removed from existing data source", () => {
    const result = SchemaParser.parse(widgetName, {
      currSourceData: testData.withRemovedKeyFromInitialDataset.dataSource,
      schema: testData.initialDataset.schemaOutput,
      fieldThemeStylesheets: testData.fieldThemeStylesheets,
    });

    expect(result).toEqual(
      testData.withRemovedKeyFromInitialDataset.schemaOutput,
    );
  });

  it("returns an updated schema when new key added to existing data source", () => {
    const widgetName = "JSONForm1";

    const result = SchemaParser.parse(widgetName, {
      currSourceData: testData.withRemovedAddedKeyToInitialDataset.dataSource,
      schema: testData.initialDataset.schemaOutput,
      fieldThemeStylesheets: testData.fieldThemeStylesheets,
    });

    expect(result).toEqual(
      testData.withRemovedAddedKeyToInitialDataset.schemaOutput,
    );
  });

  it("returns unmodified schema when existing field's value in data source changes to null and back", () => {
    // Get the initial schema
    const initialSchema = SchemaParser.parse(widgetName, {
      currSourceData: testData.initialDataset.dataSource,
      schema: {},
      fieldThemeStylesheets: testData.fieldThemeStylesheets,
    });

    expect(initialSchema).toEqual(testData.initialDataset.schemaOutput);

    // Set all keys to null
    const nulledSourceData = klona(testData.initialDataset.dataSource);
    set(nulledSourceData, "name", null);
    set(nulledSourceData, "age", null);
    set(nulledSourceData, "dob", null);
    set(nulledSourceData, "boolean", null);
    set(nulledSourceData, "hobbies", null);
    set(nulledSourceData, "%%", null);
    set(nulledSourceData, "हिन्दि", null);
    set(nulledSourceData, "education", null);
    set(nulledSourceData, "address", null);

    // Set the sourceData entry in each SchemaItem to null (only property that changes)
    const expectedSchema = klona(initialSchema);
    set(expectedSchema, "__root_schema__.children.name.sourceData", null);
    set(expectedSchema, "__root_schema__.sourceData.name", null);
    set(expectedSchema, "__root_schema__.children.age.sourceData", null);
    set(expectedSchema, "__root_schema__.sourceData.age", null);
    set(expectedSchema, "__root_schema__.children.dob.sourceData", null);
    set(expectedSchema, "__root_schema__.sourceData.dob", null);
    set(expectedSchema, "__root_schema__.children.boolean.sourceData", null);
    set(expectedSchema, "__root_schema__.sourceData.boolean", null);
    set(expectedSchema, "__root_schema__.children.hobbies.sourceData", null);
    set(expectedSchema, "__root_schema__.sourceData.hobbies", null);
    set(expectedSchema, "__root_schema__.children.education.sourceData", null);
    set(expectedSchema, "__root_schema__.sourceData.education", null);
    set(expectedSchema, "__root_schema__.children.__.sourceData", null);
    set(expectedSchema, "__root_schema__.sourceData['%%']", null);
    set(
      expectedSchema,
      "__root_schema__.children.xn__j2bd4cyac6f.sourceData",
      null,
    );
    set(expectedSchema, "__root_schema__.sourceData.हिन्दि", null);
    set(expectedSchema, "__root_schema__.children.address.sourceData", null);
    set(expectedSchema, "__root_schema__.sourceData.address", null);

    // Parse with the nulled sourceData
    const schemaWithNullKeys = SchemaParser.parse(widgetName, {
      currSourceData: nulledSourceData,
      schema: initialSchema,
      fieldThemeStylesheets: testData.fieldThemeStylesheets,
    });

    expect(schemaWithNullKeys).toEqual(expectedSchema);

    /**
     * Parse with initial sourceData to check if previous schema with null sourceData
     * can still retain the schema structure
     */
    const schemaWithRevertedData = SchemaParser.parse(widgetName, {
      currSourceData: testData.initialDataset.dataSource,
      schema: schemaWithNullKeys,
      fieldThemeStylesheets: testData.fieldThemeStylesheets,
    });

    expect(schemaWithRevertedData).toEqual(
      testData.initialDataset.schemaOutput,
    );
  });

  it("returns unmodified schema when existing fields value in data source changes to undefined and back", () => {
    // Get the initial schema
    const initialSchema = SchemaParser.parse(widgetName, {
      currSourceData: testData.initialDataset.dataSource,
      schema: {},
      fieldThemeStylesheets: testData.fieldThemeStylesheets,
    });

    expect(initialSchema).toEqual(testData.initialDataset.schemaOutput);

    // Set all keys to undefined
    const undefinedDataSource = klona(testData.initialDataset.dataSource);
    set(undefinedDataSource, "name", undefined);
    set(undefinedDataSource, "age", undefined);
    set(undefinedDataSource, "dob", undefined);
    set(undefinedDataSource, "boolean", undefined);
    set(undefinedDataSource, "hobbies", undefined);
    set(undefinedDataSource, "%%", undefined);
    set(undefinedDataSource, "हिन्दि", undefined);
    set(undefinedDataSource, "education", undefined);
    set(undefinedDataSource, "address", undefined);

    // Set the sourceData entry in each SchemaItem to undefined (only property that changes)
    const expectedSchema = klona(initialSchema);
    set(expectedSchema, "__root_schema__.children.name.sourceData", undefined);
    set(expectedSchema, "__root_schema__.sourceData.name", undefined);
    set(expectedSchema, "__root_schema__.children.age.sourceData", undefined);
    set(expectedSchema, "__root_schema__.sourceData.age", undefined);
    set(expectedSchema, "__root_schema__.children.dob.sourceData", undefined);
    set(expectedSchema, "__root_schema__.sourceData.dob", undefined);
    set(
      expectedSchema,
      "__root_schema__.children.boolean.sourceData",
      undefined,
    );
    set(expectedSchema, "__root_schema__.sourceData.boolean", undefined);
    set(
      expectedSchema,
      "__root_schema__.children.hobbies.sourceData",
      undefined,
    );
    set(expectedSchema, "__root_schema__.sourceData.hobbies", undefined);
    set(
      expectedSchema,
      "__root_schema__.children.education.sourceData",
      undefined,
    );
    set(expectedSchema, "__root_schema__.sourceData.education", undefined);
    set(expectedSchema, "__root_schema__.children.__.sourceData", undefined);
    set(expectedSchema, "__root_schema__.sourceData['%%']", undefined);
    set(
      expectedSchema,
      "__root_schema__.children.xn__j2bd4cyac6f.sourceData",
      undefined,
    );
    set(expectedSchema, "__root_schema__.sourceData.हिन्दि", undefined);
    set(
      expectedSchema,
      "__root_schema__.children.address.sourceData",
      undefined,
    );
    set(expectedSchema, "__root_schema__.sourceData.address", undefined);

    // Parse with the undefined sourceData keys
    const schemaWithUndefinedKeys = SchemaParser.parse(widgetName, {
      currSourceData: undefinedDataSource,
      schema: initialSchema,
      fieldThemeStylesheets: testData.fieldThemeStylesheets,
    });

    expect(schemaWithUndefinedKeys).toEqual(expectedSchema);

    /**
     * Parse with initial sourceData to check if previous schema with null sourceData
     * can still retain the schema structure
     */
    const schemaWithRevertedData = SchemaParser.parse(widgetName, {
      currSourceData: testData.initialDataset.dataSource,
      schema: schemaWithUndefinedKeys,
      fieldThemeStylesheets: testData.fieldThemeStylesheets,
    });

    expect(schemaWithRevertedData).toEqual(
      testData.initialDataset.schemaOutput,
    );
  });

  it("returns unmodified schema when existing inner field's value in data source changes to null and back", () => {
    // Get the initial schema
    const initialSchema = SchemaParser.parse(widgetName, {
      currSourceData: testData.initialDataset.dataSource,
      schema: {},
      fieldThemeStylesheets: testData.fieldThemeStylesheets,
    });

    expect(initialSchema).toEqual(testData.initialDataset.schemaOutput);

    // Set all keys to null
    const nulledSourceData = klona(testData.initialDataset.dataSource);
    set(nulledSourceData, "address.Line1", null);
    set(nulledSourceData, "address.city", null);
    set(nulledSourceData, "education[0].college", null);
    set(nulledSourceData, "education[0].number", null);
    set(nulledSourceData, "education[0].graduationDate", null);
    set(nulledSourceData, "education[0].boolean", null);

    // Set the sourceData entry in each SchemaItem to null (only property that changes)
    const expectedSchema = klona(initialSchema);
    set(
      expectedSchema,
      "__root_schema__.children.address.children.Line1.sourceData",
      null,
    );
    set(expectedSchema, "__root_schema__.sourceData.address.Line1", null);
    set(
      expectedSchema,
      "__root_schema__.children.address.children.city.sourceData",
      null,
    );
    set(expectedSchema, "__root_schema__.sourceData.address.city", null);
    set(
      expectedSchema,
      "__root_schema__.children.education.children.__array_item__.children.college.sourceData",
      null,
    );
    set(expectedSchema, "__root_schema__.children.address.sourceData", {
      Line1: null,
      city: null,
    });

    set(
      expectedSchema,
      "__root_schema__.sourceData.education[0].college",
      null,
    );
    set(
      expectedSchema,
      "__root_schema__.children.education.children.__array_item__.children.number.sourceData",
      null,
    );
    set(expectedSchema, "__root_schema__.sourceData.education[0].number", null);
    set(
      expectedSchema,
      "__root_schema__.children.education.children.__array_item__.children.graduationDate.sourceData",
      null,
    );
    set(
      expectedSchema,
      "__root_schema__.sourceData.education[0].graduationDate",
      null,
    );
    set(
      expectedSchema,
      "__root_schema__.children.education.children.__array_item__.children.boolean.sourceData",
      null,
    );
    set(
      expectedSchema,
      "__root_schema__.sourceData.education[0].boolean",
      null,
    );
    set(expectedSchema, "__root_schema__.children.education.sourceData", [
      {
        college: null,
        number: null,
        graduationDate: null,
        boolean: null,
      },
    ]);
    set(
      expectedSchema,
      "__root_schema__.children.education.children.__array_item__.sourceData",
      {
        college: null,
        number: null,
        graduationDate: null,
        boolean: null,
      },
    );

    // Parse with the nulled sourceData
    const schemaWithNullKeys = SchemaParser.parse(widgetName, {
      currSourceData: nulledSourceData,
      schema: initialSchema,
      fieldThemeStylesheets: testData.fieldThemeStylesheets,
    });

    expect(schemaWithNullKeys).toEqual(expectedSchema);

    /**
     * Parse with initial sourceData to check if previous schema with null sourceData
     * can still retain the schema structure
     */
    const schemaWithRevertedData = SchemaParser.parse(widgetName, {
      currSourceData: testData.initialDataset.dataSource,
      schema: schemaWithNullKeys,
      fieldThemeStylesheets: testData.fieldThemeStylesheets,
    });

    expect(schemaWithRevertedData).toEqual(
      testData.initialDataset.schemaOutput,
    );
  });

  it("returns unmodified schema when existing inner field's value in data source changes to undefined and back", () => {
    // Get the initial schema
    const initialSchema = SchemaParser.parse(widgetName, {
      currSourceData: testData.initialDataset.dataSource,
      schema: {},
      fieldThemeStylesheets: testData.fieldThemeStylesheets,
    });

    expect(initialSchema).toEqual(testData.initialDataset.schemaOutput);

    // Set all keys to undefined
    const undefinedSourceData = klona(testData.initialDataset.dataSource);
    set(undefinedSourceData, "address.Line1", undefined);
    set(undefinedSourceData, "address.city", undefined);
    set(undefinedSourceData, "education[0].college", undefined);
    set(undefinedSourceData, "education[0].number", undefined);
    set(undefinedSourceData, "education[0].graduationDate", undefined);
    set(undefinedSourceData, "education[0].boolean", undefined);

    // Set the sourceData entry in each SchemaItem to undefined (only property that changes)
    const expectedSchema = klona(initialSchema);
    set(
      expectedSchema,
      "__root_schema__.children.address.children.Line1.sourceData",
      undefined,
    );
    set(expectedSchema, "__root_schema__.sourceData.address.Line1", undefined);
    set(
      expectedSchema,
      "__root_schema__.children.address.children.city.sourceData",
      undefined,
    );
    set(expectedSchema, "__root_schema__.sourceData.address.city", undefined);
    set(
      expectedSchema,
      "__root_schema__.children.education.children.__array_item__.children.college.sourceData",
      undefined,
    );
    set(expectedSchema, "__root_schema__.children.address.sourceData", {
      Line1: undefined,
      city: undefined,
    });

    set(
      expectedSchema,
      "__root_schema__.sourceData.education[0].college",
      undefined,
    );
    set(
      expectedSchema,
      "__root_schema__.children.education.children.__array_item__.children.number.sourceData",
      undefined,
    );
    set(
      expectedSchema,
      "__root_schema__.sourceData.education[0].number",
      undefined,
    );
    set(
      expectedSchema,
      "__root_schema__.children.education.children.__array_item__.children.graduationDate.sourceData",
      undefined,
    );
    set(
      expectedSchema,
      "__root_schema__.sourceData.education[0].graduationDate",
      undefined,
    );
    set(
      expectedSchema,
      "__root_schema__.children.education.children.__array_item__.children.boolean.sourceData",
      undefined,
    );
    set(
      expectedSchema,
      "__root_schema__.sourceData.education[0].boolean",
      undefined,
    );
    set(expectedSchema, "__root_schema__.children.education.sourceData", [
      {
        college: undefined,
        number: undefined,
        graduationDate: undefined,
        boolean: undefined,
      },
    ]);
    set(
      expectedSchema,
      "__root_schema__.children.education.children.__array_item__.sourceData",
      {
        college: undefined,
        number: undefined,
        graduationDate: undefined,
        boolean: undefined,
      },
    );

    // Parse with the undefined sourceData
    const schemaWithUndefinedKeys = SchemaParser.parse(widgetName, {
      currSourceData: undefinedSourceData,
      schema: initialSchema,
      fieldThemeStylesheets: testData.fieldThemeStylesheets,
    });

    expect(schemaWithUndefinedKeys).toEqual(expectedSchema);

    /**
     * Parse with initial sourceData to check if previous schema with undefined sourceData
     * can still retain the schema structure
     */
    const schemaWithRevertedData = SchemaParser.parse(widgetName, {
      currSourceData: testData.initialDataset.dataSource,
      schema: schemaWithUndefinedKeys,
      fieldThemeStylesheets: testData.fieldThemeStylesheets,
    });

    expect(schemaWithRevertedData).toEqual(
      testData.initialDataset.schemaOutput,
    );
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
      isRequired: false,
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
      accessor: "city",
      identifier: "city",
      originalIdentifier: "city",
      position: 1,
      serverSideFiltering: false,
      isFilterable: false,
      labelTextSize: "0.875rem",
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
    schemaItem.accessor = "newCityName";

    const expectedOutput = {
      isDisabled: false,
      isRequired: false,
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
      accessor: "newCityName",
      identifier: "city",
      originalIdentifier: "city",
      position: 1,
      serverSideFiltering: false,
      isFilterable: false,
      labelTextSize: "0.875rem",
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
      isRequired: false,
      label: "Hobbies",
      isVisible: true,
      backgroundColor: "#FAFAFA",
      children: {
        __array_item__: {
          isDisabled: false,
          isRequired: false,
          label: "Array Item",
          isVisible: true,
          children: {},
          dataType: DataType.STRING,
          defaultValue: undefined,
          fieldType: FieldType.TEXT_INPUT,
          iconAlign: "left",
          sourceData: "travelling",
          isCustomField: false,
          accessor: ARRAY_ITEM_KEY,
          identifier: ARRAY_ITEM_KEY,
          originalIdentifier: ARRAY_ITEM_KEY,
          position: -1,
          isSpellCheck: false,
          labelTextSize: "0.875rem",
        },
      },
      dataType: DataType.ARRAY,
      defaultValue:
        "{{((sourceData, formData, fieldState) => (sourceData.hobbies))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
      fieldType: FieldType.ARRAY,
      sourceData: ["travelling", "skating", "off-roading"],
      isCustomField: false,
      accessor: "hobbies",
      identifier: "hobbies",
      originalIdentifier: "hobbies",
      isCollapsible: true,
      position: 4,
      labelTextSize: "0.875rem",
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
      isRequired: false,
      label: "Name",
      isVisible: true,
      backgroundColor: "#FAFAFA",
      children: {
        __array_item__: {
          isDisabled: false,
          isRequired: false,
          label: "Array Item",
          isVisible: true,
          children: {},
          dataType: DataType.OBJECT,
          defaultValue: undefined,
          fieldType: FieldType.OBJECT,
          sourceData: {},
          isCustomField: false,
          accessor: ARRAY_ITEM_KEY,
          identifier: ARRAY_ITEM_KEY,
          originalIdentifier: ARRAY_ITEM_KEY,
          position: -1,
          labelTextSize: "0.875rem",
        },
      },
      dataType: DataType.STRING,
      defaultValue:
        "{{((sourceData, formData, fieldState) => (sourceData.name))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
      fieldType: FieldType.ARRAY,
      sourceData: "Test name",
      isCustomField: false,
      accessor: "name",
      identifier: "name",
      originalIdentifier: "name",
      isCollapsible: true,
      position: 0,
      labelTextSize: "0.875rem",
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
      isRequired: false,
      label: "First Name",
      isVisible: true,
      children: {},
      dataType: DataType.STRING,
      defaultValue:
        "{{((sourceData, formData, fieldState) => (sourceData.firstName))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
      fieldType: FieldType.TEXT_INPUT,
      iconAlign: "left",
      sourceData: "John",
      isCustomField: false,
      accessor: "firstName",
      identifier: "firstName",
      originalIdentifier: "firstName",
      position: -1,
      labelTextSize: "0.875rem",
      isSpellCheck: false,
    };

    const result = SchemaParser.getSchemaItemFor(key, {
      widgetName,
      currSourceData: "John",
      sourceDataPath: "sourceData.firstName",
      skipDefaultValueProcessing: false,
      identifier: key,
    });

    expect(result).toEqual(expectedOutput);
  });

  it("returns new schemaItem for a custom field key", () => {
    const key = "firstName";

    const expectedOutput = {
      isDisabled: false,
      isRequired: false,
      label: "First Name",
      isVisible: true,
      children: {},
      dataType: DataType.STRING,
      defaultValue: undefined,
      fieldType: FieldType.TEXT_INPUT,
      iconAlign: "left",
      sourceData: "John",
      isCustomField: true,
      accessor: "firstName",
      identifier: "firstName",
      originalIdentifier: "firstName",
      position: -1,
      isSpellCheck: false,
      labelTextSize: "0.875rem",
    };

    const result = SchemaParser.getSchemaItemFor(key, {
      widgetName,
      currSourceData: "John",
      sourceDataPath: "sourceData.firstName",
      isCustomField: true,
      skipDefaultValueProcessing: false,
      identifier: key,
    });

    expect(result).toEqual(expectedOutput);
  });

  it("returns schemaItem with overridden field type", () => {
    const key = "firstName";

    const expectedOutput = {
      isDisabled: false,
      isRequired: false,
      label: "First Name",
      isVisible: true,
      children: {},
      dataType: DataType.STRING,
      defaultValue: undefined,
      fieldType: FieldType.SWITCH,
      sourceData: "John",
      isCustomField: true,
      accessor: "firstName",
      identifier: "firstName",
      originalIdentifier: "firstName",
      position: -1,
      alignWidget: "LEFT",
      labelTextSize: "0.875rem",
    };

    const result = SchemaParser.getSchemaItemFor(key, {
      widgetName,
      currSourceData: "John",
      sourceDataPath: "sourceData.firstName",
      isCustomField: true,
      fieldType: FieldType.SWITCH,
      skipDefaultValueProcessing: false,
      identifier: key,
    });

    expect(result).toEqual(expectedOutput);
  });

  it("returns array children only if dataType and fieldType are Array", () => {
    const key = "hobbies";

    const expectedOutput = {
      isDisabled: false,
      isRequired: false,
      label: "Hobbies",
      isVisible: true,
      children: {},
      dataType: DataType.ARRAY,
      defaultValue:
        "{{((sourceData, formData, fieldState) => (sourceData.hobbies))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
      fieldType: FieldType.MULTISELECT,
      sourceData: ["one", "two"],
      isFilterable: false,
      isCustomField: false,
      accessor: "hobbies",
      identifier: "hobbies",
      originalIdentifier: "hobbies",
      position: -1,
      serverSideFiltering: false,
      labelTextSize: "0.875rem",
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
      identifier: key,
    });

    expect(result).toEqual(expectedOutput);
  });
});

describe("#getUnModifiedSchemaItemFor", () => {
  it("returns unmodified schemaItem for current data", () => {
    const schemaItem = {
      isDisabled: false,
      isRequired: false,
      label: "First Name",
      isVisible: true,
      children: {},
      dataType: DataType.STRING,
      defaultValue:
        "{{((sourceData, formData, fieldState) => (sourceData.firstName))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
      fieldType: FieldType.TEXT_INPUT,
      iconAlign: "left",
      sourceData: "John",
      isCustomField: false,
      accessor: "firstName",
      identifier: "firstName",
      originalIdentifier: "firstName",
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
      identifier: schemaItem.identifier,
    });

    expect(result).toEqual(schemaItem);
  });

  it("returns array children only if dataType and fieldType are Array", () => {
    const schemaItem = {
      isDisabled: false,
      isRequired: false,
      label: "Hobbies",
      isVisible: true,
      children: {},
      dataType: DataType.ARRAY,
      defaultValue:
        '{{((sourceData, formData, fieldState) => (sourceData.hobbies.map((item) => ({ "label": item, "value": item }))))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}',
      fieldType: FieldType.MULTISELECT,
      sourceData: "John",
      isCustomField: false,
      accessor: "hobbies",
      identifier: "hobbies",
      originalIdentifier: "hobbies",
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
      identifier: schemaItem.identifier,
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
        isRequired: false,
        label: "Array Item",
        isVisible: true,
        children: {
          firstName: {
            isDisabled: false,
            isRequired: false,
            label: "First Name",
            isVisible: true,
            children: {},
            dataType: DataType.STRING,
            defaultValue: undefined,
            fieldType: FieldType.TEXT_INPUT,
            iconAlign: "left",
            sourceData: "John",
            isCustomField: false,
            accessor: "firstName",
            identifier: "firstName",
            originalIdentifier: "firstName",
            position: 0,
            isSpellCheck: false,
            labelTextSize: "0.875rem",
          },
        },
        dataType: DataType.OBJECT,
        defaultValue: undefined,
        fieldType: FieldType.OBJECT,
        sourceData: {
          firstName: "John",
        },
        isCustomField: false,
        accessor: ARRAY_ITEM_KEY,
        identifier: ARRAY_ITEM_KEY,
        originalIdentifier: ARRAY_ITEM_KEY,
        position: -1,
        labelTextSize: "0.875rem",
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
        isRequired: false,
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
            fieldType: FieldType.TEXT_INPUT,
            iconAlign: "left",
            sourceData: "John",
            isCustomField: false,
            accessor: "name",
            identifier: "firstName",
            originalIdentifier: "firstName",
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
        accessor: ARRAY_ITEM_KEY,
        identifier: ARRAY_ITEM_KEY,
        originalIdentifier: ARRAY_ITEM_KEY,
        position: -1,
      },
    };

    const expectedSchema = {
      __array_item__: {
        isDisabled: false,
        isRequired: false,
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
            fieldType: FieldType.TEXT_INPUT,
            iconAlign: "left",
            sourceData: "John",
            isCustomField: false,
            accessor: "name",
            identifier: "firstName",
            originalIdentifier: "firstName",
            position: 0,
            isSpellCheck: true,
            isRequired: true,
          },
          lastName: {
            isDisabled: false,
            isRequired: false,
            label: "Last Name",
            isVisible: true,
            children: {},
            dataType: DataType.STRING,
            defaultValue: undefined,
            fieldType: FieldType.TEXT_INPUT,
            iconAlign: "left",
            sourceData: "Doe",
            isCustomField: false,
            accessor: "lastName",
            identifier: "lastName",
            originalIdentifier: "lastName",
            position: 1,
            isSpellCheck: false,
            labelTextSize: "0.875rem",
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
        accessor: ARRAY_ITEM_KEY,
        identifier: ARRAY_ITEM_KEY,
        originalIdentifier: ARRAY_ITEM_KEY,
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
        isRequired: false,
        label: "First Name",
        isVisible: true,
        children: {},
        dataType: DataType.STRING,
        defaultValue:
          "{{((sourceData, formData, fieldState) => (sourceData.entry.firstName))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
        fieldType: FieldType.TEXT_INPUT,
        iconAlign: "left",
        sourceData: "John",
        isCustomField: false,
        accessor: "firstName",
        identifier: "firstName",
        originalIdentifier: "firstName",
        position: 0,
        isSpellCheck: false,
        labelTextSize: "0.875rem",
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
        fieldType: FieldType.TEXT_INPUT,
        iconAlign: "left",
        sourceData: "John",
        isCustomField: false,
        accessor: "name",
        identifier: "firstName",
        originalIdentifier: "firstName",
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
        fieldType: FieldType.TEXT_INPUT,
        iconAlign: "left",
        sourceData: "John",
        isCustomField: false,
        accessor: "name",
        identifier: "firstName",
        originalIdentifier: "firstName",
        position: 0,
        isSpellCheck: true,
        isRequired: true,
      },
      lastName: {
        isDisabled: false,
        isRequired: false,
        label: "Last Name",
        isVisible: true,
        children: {},
        dataType: DataType.STRING,
        defaultValue:
          "{{((sourceData, formData, fieldState) => (sourceData.entries.lastName))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
        fieldType: FieldType.TEXT_INPUT,
        iconAlign: "left",
        sourceData: "Doe",
        labelTextSize: "0.875rem",
        isCustomField: false,
        accessor: "lastName",
        identifier: "lastName",
        originalIdentifier: "lastName",
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

  it("returns modified schema with only modified updates when similar keys are passed", () => {
    const currSourceData = {
      firstName: "John",
      "##": "Doe",
      "%%": "Some other value",
    };

    const prevSchema = {
      firstName: {
        isDisabled: false,
        label: "First Name",
        isVisible: true,
        children: {},
        dataType: DataType.STRING,
        defaultValue: "Modified default value",
        fieldType: FieldType.TEXT_INPUT,
        iconAlign: "left",
        sourceData: "John",
        isCustomField: false,
        accessor: "name",
        identifier: "firstName",
        originalIdentifier: "firstName",
        position: 0,
        isSpellCheck: true,
        isRequired: true,
      },
      __: {
        isDisabled: false,
        isRequired: false,
        label: "##",
        isVisible: true,
        children: {},
        dataType: DataType.STRING,
        defaultValue:
          '{{((sourceData, formData, fieldState) => (sourceData.entries["##"]))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}',
        fieldType: FieldType.TEXT_INPUT,
        iconAlign: "left",
        sourceData: "Doe",
        isCustomField: false,
        accessor: "##",
        identifier: "__",
        originalIdentifier: "##",
        position: 1,
        isSpellCheck: false,
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
        fieldType: FieldType.TEXT_INPUT,
        iconAlign: "left",
        sourceData: "John",
        isCustomField: false,
        accessor: "name",
        identifier: "firstName",
        originalIdentifier: "firstName",
        position: 0,
        isSpellCheck: true,
        isRequired: true,
      },
      __: {
        isDisabled: false,
        isRequired: false,
        label: "##",
        isVisible: true,
        children: {},
        dataType: DataType.STRING,
        defaultValue:
          '{{((sourceData, formData, fieldState) => (sourceData.entries["##"]))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}',
        fieldType: FieldType.TEXT_INPUT,
        iconAlign: "left",
        sourceData: "Doe",
        isCustomField: false,
        accessor: "##",
        identifier: "__",
        originalIdentifier: "##",
        position: 1,
        isSpellCheck: false,
      },
      __1: {
        isDisabled: false,
        isRequired: false,
        label: "%%",
        isVisible: true,
        children: {},
        dataType: DataType.STRING,
        defaultValue:
          '{{((sourceData, formData, fieldState) => (sourceData.entries["%%"]))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}',
        fieldType: FieldType.TEXT_INPUT,
        iconAlign: "left",
        sourceData: "Some other value",
        labelTextSize: "0.875rem",
        isCustomField: false,
        accessor: "%%",
        identifier: "__1",
        originalIdentifier: "%%",
        position: 2,
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
      { foo: { bar: 20, zoo: "test" } },
      { lastName: 20, addresses: [{ line1: "line1" }] },
      { foo: { bar: { zoo: 100 } } },
    ];

    const expectedOutput = {
      firstName: "20",
      lastName: 20,
      addresses: [{ line1: "line1" }],
      foo: { zoo: "test", bar: { zoo: 100 } },
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

    expect(resultWithBasePath).toEqual("sourceData.obj.test");
    expect(resultWithoutBasePath).toEqual(".test");
  });

  it("returns path with bracket notation when name is number", () => {
    const input = 0;
    const basePath = "sourceData.arr";

    const resultWithBasePath = getSourcePath(input, basePath);
    const resultWithoutBasePath = getSourcePath(input);

    expect(resultWithBasePath).toEqual("sourceData.arr[0]");
    expect(resultWithoutBasePath).toEqual("[0]");
  });

  it("returns path with bracket notation when name cannot be used in dot notation", () => {
    const input = "first name";
    const basePath = "sourceData.arr";

    const resultWithBasePath = getSourcePath(input, basePath);
    const resultWithoutBasePath = getSourcePath(input);

    expect(resultWithBasePath).toEqual('sourceData.arr["first name"]');
    expect(resultWithoutBasePath).toEqual('["first name"]');
  });
});

describe(".getSourceDataPathFromSchemaItemPath", () => {
  it("returns source data path from schema item path", () => {
    const inputs = [
      "schema.__root_schema__.children.name",
      "schema.__root_schema__.children.education.children.__array_item__.children.college",
      "schema.__root_schema__.children.address.children.Line1",
      "schema.__root_schema__.children.education.children.__array_item__",
      "schema.__root_schema__.children.education",
      "schema.__root_schema__.children.__",
    ];

    const expectedOutputs = [
      "sourceData.name",
      "sourceData.education[0].college",
      "sourceData.address.Line1",
      "sourceData.education[0]",
      "sourceData.education",
      'sourceData["%%"]',
    ];

    inputs.forEach((input, index) => {
      const result = getSourceDataPathFromSchemaItemPath(
        testData.initialDataset.schemaOutput,
        input,
      );

      expect(result).toEqual(expectedOutputs[index]);
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
      ["string", FieldType.TEXT_INPUT],
      ["2021-12-30T10:36:12.1212+05:30", FieldType.DATEPICKER],
      ["December 30, 2021 10:36 AM", FieldType.DATEPICKER],
      ["December 30, 2021", FieldType.DATEPICKER],
      ["2021-12-30 10:36", FieldType.DATEPICKER],
      ["2021-12-30T10:36:12", FieldType.DATEPICKER],
      ["2021-12-30 10:36:12 AM", FieldType.DATEPICKER],
      ["30/12/2021 10:36", FieldType.DATEPICKER],
      ["30 December, 2021", FieldType.DATEPICKER],
      ["10:36 AM 30 December, 2021", FieldType.DATEPICKER],
      ["2021-12-30", FieldType.DATEPICKER],
      ["12-30-2021", FieldType.DATEPICKER],
      ["30-12-2021", FieldType.DATEPICKER],
      ["12/30/2021", FieldType.DATEPICKER],
      ["30/12/2021", FieldType.DATEPICKER],
      ["30/12/21", FieldType.DATEPICKER],
      ["12/30/21", FieldType.DATEPICKER],
      ["40/10/40", FieldType.TEXT_INPUT],
      ["2000/10", FieldType.TEXT_INPUT],
      ["1", FieldType.TEXT_INPUT],
      ["#111", FieldType.TEXT_INPUT],
      ["999", FieldType.TEXT_INPUT],
      ["test@demo.com", FieldType.EMAIL_INPUT],
      ["test@.com", FieldType.TEXT_INPUT],
      [10, FieldType.NUMBER_INPUT],
      [[{}], FieldType.ARRAY],
      [[""], FieldType.MULTISELECT],
      [[1], FieldType.MULTISELECT],
      [[null], FieldType.MULTISELECT],
      [null, FieldType.TEXT_INPUT],
      [undefined, FieldType.TEXT_INPUT],
      [{ foo: "" }, FieldType.OBJECT],
      [
        () => {
          10;
        },
        FieldType.TEXT_INPUT,
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
      "%%",
      "हिन्दि",
      "education",
      "address",
    ];

    const result = getKeysFromSchema(
      testData.initialDataset.schemaOutput.__root_schema__.children,
      ["originalIdentifier"],
    );

    expect(result).toEqual(expectedOutput);
  });

  it("return empty array for empty schema", () => {
    const result = getKeysFromSchema({}, ["originalIdentifier"]);

    expect(result).toEqual([]);
  });

  it("return keys for non custom fields only", () => {
    const schema = klona(
      testData.initialDataset.schemaOutput.__root_schema__.children,
    );

    schema.name.isCustomField = true;

    const expectedOutput = [
      "age",
      "dob",
      "boolean",
      "hobbies",
      "%%",
      "हिन्दि",
      "education",
      "address",
    ];

    const result = getKeysFromSchema(schema, ["originalIdentifier"], {
      onlyNonCustomFieldKeys: true,
    });

    expect(result).toEqual(expectedOutput);
  });

  it("return keys and including custom field keys", () => {
    const schema = klona(
      testData.initialDataset.schemaOutput.__root_schema__.children,
    );

    schema.name.isCustomField = true;

    const expectedOutput = [
      "name",
      "age",
      "dob",
      "boolean",
      "hobbies",
      "%%",
      "हिन्दि",
      "education",
      "address",
    ];

    const result = getKeysFromSchema(schema, ["originalIdentifier"]);

    expect(result).toEqual(expectedOutput);
  });
});

it("return only custom field keys", () => {
  const schema = klona(
    testData.initialDataset.schemaOutput.__root_schema__.children,
  );

  schema.name.isCustomField = true;

  const expectedOutput = ["name"];

  const result = getKeysFromSchema(schema, ["originalIdentifier"], {
    onlyCustomFieldKeys: true,
  });

  expect(result).toEqual(expectedOutput);
});

describe("#applyPositions", () => {
  it("applies positions to new keys added to the schema ", () => {
    const schema: Schema = klona(
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
    expect(schema.__.position).toEqual(5);
    expect(schema.xn__j2bd4cyac6f.position).toEqual(6);
    expect(schema.education.position).toEqual(7);
    expect(schema.address.position).toEqual(8);
    expect(schema.firstNewField.position).toEqual(9);
    expect(schema.secondNewField.position).toEqual(10);
  });

  it("repositions any when keys are deleted only when new keys added to the schema ", () => {
    const schema: Schema = klona(
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
    expect(schema.__.position).toEqual(4);
    expect(schema.xn__j2bd4cyac6f.position).toEqual(5);
    expect(schema.address.position).toEqual(6);
    expect(schema.firstNewField.position).toEqual(7);
    expect(schema.secondNewField.position).toEqual(8);

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
