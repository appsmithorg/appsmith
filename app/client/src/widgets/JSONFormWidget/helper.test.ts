import { DataType, FieldType, SchemaItem } from "./constants";
import { schemaItemDefaultValue } from "./helper";

describe(".schemaItemDefaultValue", () => {
  it("returns array default value when sub array fields don't have default value", () => {
    const schemaItem = ({
      name: "education",
      accessor: "education",
      identifier: "education",
      originalIdentifier: "education",
      dataType: DataType.ARRAY,
      fieldType: FieldType.ARRAY,
      defaultValue: [
        {
          college: "String field",
          graduationDate: "10/12/2021",
        },
      ],
      children: {
        __array_item__: {
          name: "__array_item__",
          accessor: "__array_item__",
          identifier: "__array_item__",
          originalIdentifier: "__array_item__",
          dataType: DataType.OBJECT,
          fieldType: FieldType.OBJECT,
          defaultValue: undefined,
          children: {
            college: {
              label: "College",
              children: {},
              dataType: DataType.STRING,
              defaultValue: undefined,
              fieldType: FieldType.TEXT,
              name: "college",
              accessor: "college",
              identifier: "college",
              originalIdentifier: "college",
            },
            graduationDate: {
              children: {},
              dataType: DataType.STRING,
              defaultValue: undefined,
              fieldType: FieldType.DATE,
              name: "graduationDate",
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

    const result = schemaItemDefaultValue(schemaItem);

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
      defaultValue: [
        {
          college: "String field",
          graduationDate: "10/12/2021",
        },
      ],
      children: {
        __array_item__: {
          name: "__array_item__",
          accessor: "__array_item__",
          identifier: "__array_item__",
          originalIdentifier: "__array_item__",
          dataType: DataType.OBJECT,
          fieldType: FieldType.OBJECT,
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
              fieldType: FieldType.TEXT,
              name: "college",
              accessor: "college",
              identifier: "college",
              originalIdentifier: "college",
            },
            graduationDate: {
              children: {},
              dataType: DataType.STRING,
              defaultValue: undefined,
              fieldType: FieldType.DATE,
              name: "graduationDate",
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
        graduationDate: "10/12/2021",
      },
    ];

    const result = schemaItemDefaultValue(schemaItem);

    expect(result).toEqual(expectedDefaultValue);
  });

  it("returns only sub array fields default value, when array level default value is empty", () => {
    const schemaItem = ({
      name: "education",
      accessor: "education",
      identifier: "education",
      originalIdentifier: "education",
      dataType: DataType.ARRAY,
      fieldType: FieldType.ARRAY,
      defaultValue: undefined,
      children: {
        __array_item__: {
          name: "__array_item__",
          accessor: "__array_item__",
          identifier: "__array_item__",
          originalIdentifier: "__array_item__",
          dataType: DataType.OBJECT,
          fieldType: FieldType.OBJECT,
          defaultValue: undefined,
          children: {
            college: {
              label: "College",
              children: {},
              dataType: DataType.STRING,
              defaultValue: "Some college name",
              fieldType: FieldType.TEXT,
              name: "college",
              accessor: "college",
              identifier: "college",
              originalIdentifier: "college",
            },
            graduationDate: {
              children: {},
              dataType: DataType.STRING,
              defaultValue: "10/10/2001",
              fieldType: FieldType.DATE,
              name: "graduationDate",
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

    const result = schemaItemDefaultValue(schemaItem);

    expect(result).toEqual(expectedDefaultValue);
  });

  it("returns valid default value when non compliant keys in default value is present", () => {
    const schemaItem = ({
      name: "education",
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
          name: "__array_item__",
          accessor: "__array_item__",
          identifier: "__array_item__",
          originalIdentifier: "__array_item__",
          dataType: DataType.OBJECT,
          fieldType: FieldType.OBJECT,
          defaultValue: undefined,
          children: {
            graduating_college: {
              label: "College",
              children: {},
              dataType: DataType.STRING,
              defaultValue: undefined,
              fieldType: FieldType.TEXT,
              name: "college",
              accessor: "college",
              identifier: "graduating_college",
              originalIdentifier: "graduating college",
            },
            graduation_date: {
              children: {},
              dataType: DataType.STRING,
              defaultValue: undefined,
              fieldType: FieldType.DATE,
              name: "newDate",
              accessor: "newDate",
              identifier: "graduation_date",
              originalIdentifier: "graduation date",
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

    const result = schemaItemDefaultValue(schemaItem);

    expect(result).toEqual(expectedDefaultValue);
  });
});
