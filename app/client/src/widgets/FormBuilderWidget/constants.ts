import ArrayField from "./fields/ArrayField";
import CheckboxField from "./fields/CheckboxField";
import InputField from "./fields/InputField";
import MultiSelectField from "./fields/MultiSelectField";
import ObjectField from "./fields/ObjectField";
import SelectField from "./fields/SelectField";
import SwitchField from "./fields/SwitchField";
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

export type SchemaItem<TProps = any> = {
  children: Schema;
  // TODO: Define typings for props
  props: TProps;
  dataType: DataType;
  fieldType: FieldType;
  name: string;
  subDataType?: DataType;
  label: string;
};

export type Schema = SchemaItem[];

export const FIELD_MAP: Record<FieldType, (props: any) => JSX.Element> = {
  [FieldType.TEXT]: SelectField,
  [FieldType.NUMBER]: InputField,
  [FieldType.EMAIL]: InputField,
  [FieldType.PHONE_NUMBER]: InputField,
  [FieldType.CHECKBOX]: CheckboxField,
  [FieldType.DATE]: InputField,
  [FieldType.FILE]: InputField,
  [FieldType.RADIO_GROUP]: InputField,
  [FieldType.MULTI_SELECT]: MultiSelectField,
  [FieldType.SELECT]: SelectField,
  [FieldType.SWITCH]: SwitchField,
  [FieldType.TIME]: InputField,
  [FieldType.ARRAY]: ArrayField,
  [FieldType.OBJECT]: ObjectField,
};

/**
 * This translates FieldType to Input component inputType
 * As InputField would handle all the below types (Text/Number), this map
 * would help use identify what inputType it is based on the FieldType.
 */
export const INPUT_FIELD_TYPE = {
  [FieldType.TEXT]: "TEXT",
  [FieldType.NUMBER]: "NUMBER",
  [FieldType.PHONE_NUMBER]: "PHONE_NUMBER",
  [FieldType.EMAIL]: "EMAIL",
} as Record<FieldType, InputType>;

export const DATA_TYPE_POTENTIAL_FIELD = {
  [DataType.STRING]: {
    default: FieldType.TEXT,
    options: [
      FieldType.TEXT,
      FieldType.EMAIL,
      FieldType.PHONE_NUMBER,
      FieldType.SELECT,
    ],
  },
  [DataType.BOOLEAN]: {
    default: FieldType.SWITCH,
    options: [FieldType.SWITCH, FieldType.CHECKBOX],
  },
  [DataType.NUMBER]: {
    default: FieldType.NUMBER,
    options: [FieldType.NUMBER, FieldType.PHONE_NUMBER],
  },
  [DataType.BIGINT]: {
    default: FieldType.NUMBER,
    options: [FieldType.NUMBER],
  },
  [DataType.SYMBOL]: {
    default: FieldType.TEXT,
    options: [FieldType.TEXT],
  },
  [DataType.UNDEFINED]: {
    default: FieldType.TEXT,
    options: [FieldType.TEXT],
  },
  [DataType.NULL]: {
    default: FieldType.TEXT,
    options: [FieldType.TEXT],
  },
  [DataType.OBJECT]: {
    default: FieldType.OBJECT,
    options: [FieldType.OBJECT],
  },
  [DataType.ARRAY]: {
    default: FieldType.ARRAY,
    options: [FieldType.ARRAY, FieldType.MULTI_SELECT],
  },
  [DataType.FUNCTION]: {
    default: FieldType.TEXT,
    options: [FieldType.TEXT],
  },
};
