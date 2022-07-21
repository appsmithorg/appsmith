import { get, set } from "lodash";

import schemaTestData from "widgets/JSONFormWidget/schemaTestData";
import {
  ARRAY_ITEM_KEY,
  DataType,
  FieldType,
  Schema,
  SchemaItem,
} from "widgets/JSONFormWidget/constants";
import { JSONFormWidgetProps } from "..";
import {
  fieldTypeUpdateHook,
  getSchemaItem,
  getStylesheetValue,
  hiddenIfArrayItemIsObject,
  updateChildrenDisabledStateHook,
} from "./helper";

import { klona as clone } from "klona/full";

const widgetName = "JSONForm1";

describe(".fieldTypeUpdateHook", () => {
  it("updates valid new schema item for a field type multiselect -> array", () => {
    const schema = schemaTestData.initialDataset.schemaOutput;
    const schemaItemPath = "__root_schema__.children.hobbies";
    const propertyPath = `schema.${schemaItemPath}.fieldType`;
    const fieldType = FieldType.ARRAY;

    const oldSchemaItem: SchemaItem = get(schema, schemaItemPath);

    const expectedNewSchemaItem = {
      isCollapsible: true,
      isDisabled: false,
      isRequired: false,
      isVisible: true,
      label: "Hobbies",
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
          identifier: ARRAY_ITEM_KEY,
          accessor: ARRAY_ITEM_KEY,
          originalIdentifier: ARRAY_ITEM_KEY,
          isSpellCheck: false,
          position: -1,
          accentColor:
            "{{((sourceData, formData, fieldState) => (appsmith.theme.colors.primaryColor))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
          borderRadius:
            "{{((sourceData, formData, fieldState) => (appsmith.theme.borderRadius.appBorderRadius))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
          boxShadow: "none",
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
      position: 4,
      labelTextSize: "0.875rem",
    };

    const expectedNewSchema = set(
      clone(schema),
      schemaItemPath,
      expectedNewSchemaItem,
    );

    const [result] =
      fieldTypeUpdateHook(
        ({
          schema,
          widgetName,
          childStylesheet: schemaTestData.fieldThemeStylesheets,
        } as unknown) as JSONFormWidgetProps,
        propertyPath,
        fieldType,
      ) || [];

    const newSchema: SchemaItem = result.propertyValue;

    expect(result.propertyPath).toEqual("schema");
    expect(oldSchemaItem.fieldType).toEqual(FieldType.MULTISELECT);
    expect(newSchema).toEqual(expectedNewSchema);
  });

  it("updates valid new schema item for a field type array -> multiselect", () => {
    const oldSchema = clone(schemaTestData.initialDataset.schemaOutput);
    const schemaItemPath = "__root_schema__.children.hobbies";
    const propertyPath = `schema.${schemaItemPath}.fieldType`;
    const fieldType = FieldType.MULTISELECT;

    const oldSchemaItem = {
      isCollapsible: true,
      isDisabled: false,
      isVisible: true,
      label: "Hobbies",
      children: {
        __array_item__: {
          isDisabled: false,
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
          isSpellCheck: false,
          position: -1,
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "none",
        },
      },
      dataType: DataType.ARRAY,
      defaultValue:
        "{{((sourceData, formData, fieldState) => (sourceData.hobbies))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
      fieldType: FieldType.ARRAY,
      sourceData: ["travelling", "skating", "off-roading"],
      isCustomField: false,
      name: "hobbies",
      accessor: "hobbies",
      identifier: "hobbies",
      originalIdentifier: "hobbies",
      position: 4,
    };

    const expectedNewSchema = clone(schemaTestData.initialDataset.schemaOutput);

    set(oldSchema, "__root_schema__.children.hobbies", oldSchemaItem);

    const [result] =
      fieldTypeUpdateHook(
        ({
          schema: oldSchema,
          widgetName,
          childStylesheet: schemaTestData.fieldThemeStylesheets,
        } as unknown) as JSONFormWidgetProps,
        propertyPath,
        fieldType,
      ) || [];

    const newSchema: SchemaItem = result.propertyValue;

    expect(result.propertyPath).toEqual("schema");
    expect(oldSchemaItem.fieldType).toEqual(FieldType.ARRAY);
    expect(newSchema).toEqual(expectedNewSchema);
  });
});

describe(".hiddenIfArrayItemIsObject", () => {
  it("returns boolean for schemaItem is an array item for field type object or array", () => {
    const schema = schemaTestData.initialDataset.schemaOutput;
    const inputs = [
      "schema.__root_schema__.children.hobbies.fieldType",
      "schema.__root_schema__.children.education",
      "schema.__root_schema__.children.education.children.__array_item__.defaultValue",
    ];

    const expectedOutput = [false, false, true];

    inputs.forEach((input, index) => {
      const result = hiddenIfArrayItemIsObject(
        ({
          schema,
        } as unknown) as JSONFormWidgetProps,
        input,
      );

      expect(result).toEqual(expectedOutput[index]);
    });
  });

  it("returns boolean for schemaItem is an array item for field type object or array with checkGrandParentPath options", () => {
    const schema = schemaTestData.initialDataset.schemaOutput;
    const inputs = [
      "schema.__root_schema__.children.hobbies.fieldType",
      "schema.__root_schema__.children.education",
      "schema.__root_schema__.children.education.children.__array_item__.children.age",
    ];

    const expectedOutput = [false, false, true];

    inputs.forEach((input, index) => {
      const result = hiddenIfArrayItemIsObject(
        ({
          schema,
        } as unknown) as JSONFormWidgetProps,
        input,
        {
          checkGrandParentPath: true,
        },
      );

      expect(result).toEqual(expectedOutput[index]);
    });
  });
});

describe(".getSchemaItem", () => {
  it("returns matchers", () => {
    const schema = schemaTestData.initialDataset.schemaOutput;
    const propertyPath = "schema.__root_schema__.children.hobbies.fieldType";

    const result = getSchemaItem(
      ({
        schema,
      } as unknown) as JSONFormWidgetProps,
      propertyPath,
    );

    expect(result.fieldTypeMatches).toBeDefined();
    expect(result.fieldTypeNotMatches).toBeDefined();
    expect(result.fieldTypeNotIncludes).toBeDefined();
    expect(result.compute).toBeDefined();
  });

  it("returns boolean when fieldTypeMatches is chained", () => {
    const schema = schemaTestData.initialDataset.schemaOutput;
    const propertyPath = "schema.__root_schema__.children.hobbies.fieldType";

    const inputs = [
      FieldType.NUMBER_INPUT,
      FieldType.ARRAY,
      FieldType.MULTISELECT,
    ];
    const expectedOutput = [false, false, true];

    inputs.forEach((input, index) => {
      const result = getSchemaItem(
        ({
          schema,
        } as unknown) as JSONFormWidgetProps,
        propertyPath,
      ).fieldTypeMatches(input);

      expect(result).toEqual(expectedOutput[index]);
    });
  });

  it("returns boolean when fieldTypeNotMatches is chained", () => {
    const schema = schemaTestData.initialDataset.schemaOutput;
    const propertyPath = "schema.__root_schema__.children.hobbies.fieldType";

    const inputs = [
      FieldType.NUMBER_INPUT,
      FieldType.ARRAY,
      FieldType.MULTISELECT,
    ];
    const expectedOutput = [true, true, false];

    inputs.forEach((input, index) => {
      const result = getSchemaItem(
        ({
          schema,
        } as unknown) as JSONFormWidgetProps,
        propertyPath,
      ).fieldTypeNotMatches(input);

      expect(result).toEqual(expectedOutput[index]);
    });
  });

  it("returns boolean when fieldTypeNotIncludes is chained", () => {
    const schema = schemaTestData.initialDataset.schemaOutput;
    const propertyPath = "schema.__root_schema__.children.hobbies.fieldType";

    const inputs = [
      [FieldType.NUMBER_INPUT, FieldType.ARRAY, FieldType.MULTISELECT],
      [FieldType.SWITCH, FieldType.DATEPICKER],
    ];
    const expectedOutput = [false, true];

    inputs.forEach((input, index) => {
      const result = getSchemaItem(
        ({
          schema,
        } as unknown) as JSONFormWidgetProps,
        propertyPath,
      ).fieldTypeNotIncludes(input);

      expect(result).toEqual(expectedOutput[index]);
    });
  });

  it("returns any value returned from the callback passed to the .then method", () => {
    const schema = schemaTestData.initialDataset.schemaOutput;
    const propertyPath = "schema.__root_schema__.children.hobbies.fieldType";

    const expectedOutput = get(schema, "__root_schema__.children.hobbies");

    const result = getSchemaItem(
      ({
        schema,
      } as unknown) as JSONFormWidgetProps,
      propertyPath,
    ).compute((schemaItem) => schemaItem);

    expect(result).toEqual(expectedOutput);
  });
});

describe(".updateChildrenDisabledStateHook", () => {
  it("recursively updates isDisabled of all it's children", () => {
    const schema = schemaTestData.initialDataset.schemaOutput;
    const propertyPath = "schema.__root_schema__.children.education.isDisabled";
    const isDisabled = true;
    const oldSchema: Schema = get(
      schema,
      "__root_schema__.children.education.children",
    );

    const [result] =
      updateChildrenDisabledStateHook(
        ({
          schema,
        } as unknown) as JSONFormWidgetProps,
        propertyPath,
        isDisabled,
      ) || [];

    const updatedSchema: Schema = result.propertyValue;

    expect(result.propertyPath);
    expect(oldSchema.__array_item__.children.college.isDisabled).toEqual(false);
    expect(oldSchema.__array_item__.children.number.isDisabled).toEqual(false);
    expect(oldSchema.__array_item__.children.graduationDate.isDisabled).toEqual(
      false,
    );
    expect(oldSchema.__array_item__.children.boolean.isDisabled).toEqual(false);

    expect(updatedSchema.__array_item__.children.college.isDisabled).toEqual(
      true,
    );
    expect(updatedSchema.__array_item__.children.number.isDisabled).toEqual(
      true,
    );
    expect(
      updatedSchema.__array_item__.children.graduationDate.isDisabled,
    ).toEqual(true);
    expect(updatedSchema.__array_item__.children.boolean.isDisabled).toEqual(
      true,
    );
  });
});

describe(".getStylesheetValue", () => {
  it("returns valid stylesheet value", () => {
    const props = ({
      widgetName: "Form1",
      schema: schemaTestData.initialDataset.schemaOutput,
    } as unknown) as JSONFormWidgetProps;

    const inputAndExpectedOutput = [
      ["", ""],
      ["schema.__root_schema__.children.education.isDisabled", ""],
      [
        "schema.__root_schema__.children.name.borderRadius",
        "{{((sourceData, formData, fieldState) => (appsmith.theme.borderRadius.appBorderRadius))(Form1.sourceData, Form1.formData, Form1.fieldState)}}",
      ],
      ["schema", ""],
    ];

    inputAndExpectedOutput.forEach(([input, expectedOutput]) => {
      //@ts-expect-error: type mismatch
      const result = getStylesheetValue(props, input, {
        childStylesheet: schemaTestData.fieldThemeStylesheets,
      });

      expect(result).toEqual(expectedOutput);
    });
  });
});
