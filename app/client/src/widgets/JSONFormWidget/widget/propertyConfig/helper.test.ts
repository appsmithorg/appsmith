import { cloneDeep, get, set } from "lodash";

import schemaTestData from "widgets/JSONFormWidget/schemaTestData";
import {
  DataType,
  FieldType,
  Schema,
  SchemaItem,
} from "widgets/JSONFormWidget/constants";
import { JSONFormWidgetProps } from "..";
import {
  fieldTypeUpdateHook,
  getSchemaItem,
  hiddenIfArrayItemIsObject,
  updateChildrenDisabledStateHook,
} from "./helper";

const widgetName = "JSONForm1";

describe(".fieldTypeUpdateHook", () => {
  it("updates valid new schema item for a field type multiselect -> array", () => {
    const schema = schemaTestData.initialDataset.schemaOutput;
    const propertyPath = "schema.__root_schema__.children.hobbies.fieldType";
    const fieldType = FieldType.ARRAY;

    const oldSchemaItem: SchemaItem = get(
      schema,
      "__root_schema__.children.hobbies",
    );

    const expectedNewSchemaItem = {
      isCollapsible: true,
      isDisabled: false,
      isRequired: false,
      isVisible: true,
      label: "Hobbies",
      children: {
        __array_item__: {
          isDisabled: false,
          isRequired: false,
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
          originalIdentifier: "__array_item__",
          isSpellCheck: false,
          position: -1,
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
      originalIdentifier: "hobbies",
      position: 4,
    };

    const [result] =
      fieldTypeUpdateHook(
        ({ schema, widgetName } as unknown) as JSONFormWidgetProps,
        propertyPath,
        fieldType,
      ) || [];

    const newSchemaItem: SchemaItem = result.propertyValue;

    expect(result.propertyPath).toEqual(
      "schema.__root_schema__.children.hobbies",
    );
    expect(oldSchemaItem.fieldType).toEqual(FieldType.MULTI_SELECT);
    expect(newSchemaItem).toEqual(expectedNewSchemaItem);
  });

  it("updates valid new schema item for a field type array -> multiselect", () => {
    const schema = cloneDeep(schemaTestData.initialDataset.schemaOutput);
    const propertyPath = "schema.__root_schema__.children.hobbies.fieldType";
    const fieldType = FieldType.MULTI_SELECT;

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
          fieldType: FieldType.TEXT,
          sourceData: "travelling",
          isCustomField: false,
          name: "__array_item__",
          identifier: "__array_item__",
          originalIdentifier: "__array_item__",
          isSpellCheck: false,
          position: -1,
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
      originalIdentifier: "hobbies",
      position: 4,
    };

    const expectedNewSchemaItem = get(
      schema,
      "__root_schema__.children.hobbies",
      {},
    );

    set(schema, "__root_schema__.children.hobbies", oldSchemaItem);

    const [result] =
      fieldTypeUpdateHook(
        ({ schema, widgetName } as unknown) as JSONFormWidgetProps,
        propertyPath,
        fieldType,
      ) || [];

    const newSchemaItem: SchemaItem = result.propertyValue;

    expect(result.propertyPath).toEqual(
      "schema.__root_schema__.children.hobbies",
    );
    expect(oldSchemaItem.fieldType).toEqual(FieldType.ARRAY);
    expect(newSchemaItem).toEqual(expectedNewSchemaItem);
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
    expect(result.then).toBeDefined();
  });

  it("returns boolean when fieldTypeMatches is chained", () => {
    const schema = schemaTestData.initialDataset.schemaOutput;
    const propertyPath = "schema.__root_schema__.children.hobbies.fieldType";

    const inputs = [FieldType.NUMBER, FieldType.ARRAY, FieldType.MULTI_SELECT];
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

    const inputs = [FieldType.NUMBER, FieldType.ARRAY, FieldType.MULTI_SELECT];
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
      [FieldType.NUMBER, FieldType.ARRAY, FieldType.MULTI_SELECT],
      [FieldType.SWITCH, FieldType.DATE],
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
    ).then((schemaItem) => schemaItem);

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
