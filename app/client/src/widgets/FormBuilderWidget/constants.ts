import ArrayField from "./fields/ArrayField";
import InputField from "./fields/InputField";
import MultiSelectField from "./fields/MultiSelectField";
import ObjectField from "./fields/ObjectField";
import { InputType } from "widgets/InputWidget/constants";

export enum FieldType {
  CHECKBOX = "Checkbox",
  DATE = "Date",
  EMAIL = "Email",
  FILE = "File",
  MULTI_SELECT = "Multi-Select",
  NUMBER = "Number",
  PHONE_NUMBER = "Phone Number",
  RADIO_GROUP = "Radio-Group",
  SELECT = "Select",
  SWITCH = "Switch",
  TEXT = "Text",
  TIME = "Time",
  ARRAY = "Array",
  OBJECT = "Object",
}

export enum DataType {
  STRING = "string",
  NUMBER = "number",
  ARRAY = "array",
  BOOLEAN = "boolean",
  OBJECT = "object",
  BIGINT = "bigint",
  SYMBOL = "symbol",
  UNDEFINED = "undefined",
  NULL = "null",
  FUNCTION = "function",
}

export type SchemaItem = {
  children: Schema;
  // TODO: Define typings for props
  props: Record<string, any>;
  dataType: DataType;
  fieldType: FieldType;
  name: string;
  subDataType?: DataType;
  label: string;
};

export type Schema = SchemaItem[];

export const FIELD_MAP: Record<FieldType, (props: any) => JSX.Element> = {
  [FieldType.TEXT]: InputField,
  [FieldType.NUMBER]: InputField,
  [FieldType.EMAIL]: InputField,
  [FieldType.PHONE_NUMBER]: InputField,
  [FieldType.CHECKBOX]: InputField,
  [FieldType.DATE]: InputField,
  [FieldType.FILE]: InputField,
  [FieldType.RADIO_GROUP]: InputField,
  [FieldType.MULTI_SELECT]: MultiSelectField,
  [FieldType.SELECT]: InputField,
  [FieldType.SWITCH]: InputField,
  [FieldType.TIME]: InputField,
  [FieldType.ARRAY]: ArrayField,
  [FieldType.OBJECT]: ObjectField,
};

export const INPUT_FIELD_TYPE = {
  [FieldType.TEXT]: "TEXT",
  [FieldType.NUMBER]: "NUMBER",
  [FieldType.PHONE_NUMBER]: "PHONE_NUMBER",
  [FieldType.EMAIL]: "EMAIL",
} as Record<FieldType, InputType>;

export const DATA_TYPE_POTENTIAL_FIELD = {
  [DataType.STRING]: {
    default: FieldType.TEXT,
    options: [FieldType.TEXT, FieldType.EMAIL, FieldType.PHONE_NUMBER],
  },
  [DataType.BOOLEAN]: {
    default: FieldType.SWITCH,
    options: [FieldType.SWITCH, FieldType.TEXT],
  },
  [DataType.NUMBER]: {
    default: FieldType.NUMBER,
    options: [FieldType.NUMBER],
  },
  [DataType.BIGINT]: {
    default: FieldType.NUMBER,
    options: [FieldType.NUMBER],
  },
  [DataType.SYMBOL]: {
    default: FieldType.NUMBER,
    options: [FieldType.NUMBER],
  },
  [DataType.UNDEFINED]: {
    default: FieldType.NUMBER,
    options: [FieldType.NUMBER],
  },
  [DataType.NULL]: {
    default: FieldType.NUMBER,
    options: [FieldType.NUMBER],
  },
  [DataType.OBJECT]: {
    default: FieldType.OBJECT,
    options: [FieldType.NUMBER],
  },
  [DataType.ARRAY]: {
    default: FieldType.ARRAY,
    options: [FieldType.NUMBER],
  },
  [DataType.FUNCTION]: {
    default: FieldType.NUMBER,
    options: [FieldType.NUMBER],
  },
};
