import { InputType } from "widgets/InputWidget/constants";
import { BaseFieldComponentProps } from "./fields/types";
import {
  ArrayField,
  CheckboxField,
  DateField,
  InputField,
  MultiSelectField,
  ObjectField,
  RadioGroupField,
  SelectField,
  SwitchField,
} from "./fields";

export enum FieldType {
  CHECKBOX = "Checkbox",
  DATE = "Date",
  EMAIL = "Email",
  MULTI_SELECT = "Multi-Select",
  NUMBER = "Number",
  PHONE_NUMBER = "Phone Number",
  RADIO_GROUP = "Radio-Group",
  SELECT = "Select",
  SWITCH = "Switch",
  TEXT = "Text",
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
  dataType: DataType;
  fieldType: FieldType;
  formData: any;
  isCustomField: boolean;
  isVisible: boolean;
  label: string;
  name: string;
  position: number;
  props: TProps;
  tooltip?: string;
};

// This defines a react component with componentDefaultValues property attached to it.
type FieldComponent = {
  (props: BaseFieldComponentProps): JSX.Element | null;
  componentDefaultValues: Record<string, any>;
};

export type Schema = Record<string, SchemaItem>;

export const ARRAY_ITEM_KEY = "__array_item__";
export const ROOT_SCHEMA_KEY = "__root_schema__";

export const FIELD_MAP: Record<FieldType, FieldComponent> = {
  [FieldType.TEXT]: InputField,
  [FieldType.NUMBER]: InputField,
  [FieldType.EMAIL]: InputField,
  [FieldType.PHONE_NUMBER]: InputField,
  [FieldType.CHECKBOX]: CheckboxField,
  [FieldType.DATE]: DateField,
  [FieldType.RADIO_GROUP]: RadioGroupField,
  [FieldType.MULTI_SELECT]: MultiSelectField,
  [FieldType.SELECT]: SelectField,
  [FieldType.SWITCH]: SwitchField,
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

export const FIELD_EXPECTING_OPTIONS = [
  FieldType.MULTI_SELECT,
  FieldType.MULTI_SELECT,
  FieldType.RADIO_GROUP,
  FieldType.SELECT,
];

export const DATA_TYPE_POTENTIAL_FIELD = {
  [DataType.STRING]: {
    default: FieldType.TEXT,
    options: [
      FieldType.DATE,
      FieldType.EMAIL,
      FieldType.PHONE_NUMBER,
      FieldType.RADIO_GROUP,
      FieldType.SELECT,
      FieldType.TEXT,
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

// The potential value here is just for representation i.e it won't be used to set default value anywhere.
// This will just help to transform a field type (when modified in custom field) to appropriate schemaItem
// using schemaParser.
export const FIELD_TYPE_TO_POTENTIAL_DATA: Record<FieldType, any> = {
  [FieldType.TEXT]: "",
  [FieldType.NUMBER]: 0,
  [FieldType.EMAIL]: "",
  [FieldType.PHONE_NUMBER]: "",
  [FieldType.CHECKBOX]: true,
  [FieldType.DATE]: "",
  [FieldType.RADIO_GROUP]: "",
  [FieldType.MULTI_SELECT]: [],
  [FieldType.SELECT]: "",
  [FieldType.SWITCH]: true,
  [FieldType.ARRAY]: [{}],
  [FieldType.OBJECT]: {},
};

export const FIELD_PADDING_X = 15;
export const FIELD_PADDING_Y = 10;
