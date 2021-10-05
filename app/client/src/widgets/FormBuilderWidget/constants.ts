import { omit } from "lodash";

import ArrayField from "./fields/ArrayField";
import InputField from "./fields/InputField";
import MultiSelectField from "./fields/MultiSelectField";
import ObjectField from "./fields/ObjectField";
import { CONFIG as INPUT_WIDGET_CONFIG } from "widgets/InputWidget";
import { CONFIG as SWITCH_WIDGET_CONFIG } from "widgets/SwitchWidget";

export type SchemaObjectConfig = {
  validation?: string[];
  props?: Record<string, any>;
};

export enum FieldType {
  CHECKBOX = "Checkbox",
  DATE = "Date",
  EMAIL = "Email",
  FILE = "File",
  MULTI_SELECT = "Multi-Select",
  NUMBER = "Number",
  PHONE = "Phone",
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

export type SchemaObject = {
  children: Schema;
  config: SchemaObjectConfig;
  dataType: DataType;
  fieldType: FieldType;
  name: string;
  subDataType?: DataType;
  title: string;
};

export type Schema = Record<string, SchemaObject>;

type ComponentMapObj = {
  fieldComponent: (props: any) => JSX.Element;
  defaultProps: Record<string, any>;
};

const BLACKLISTED_DEFAULT_CONFIG_KEYS = [
  "columns",
  "rows",
  "version",
  "widgetName",
];

export const FIELD_MAP: Record<FieldType, ComponentMapObj> = {
  [FieldType.TEXT]: {
    fieldComponent: InputField,
    defaultProps: {
      ...omit(INPUT_WIDGET_CONFIG.defaults, BLACKLISTED_DEFAULT_CONFIG_KEYS),
      multiline: false,
    },
  },
  [FieldType.NUMBER]: {
    fieldComponent: InputField,
    defaultProps: {},
  },
  [FieldType.EMAIL]: {
    fieldComponent: InputField,
    defaultProps: {},
  },
  [FieldType.PHONE]: {
    fieldComponent: InputField,
    defaultProps: {},
  },
  [FieldType.CHECKBOX]: {
    fieldComponent: InputField,
    defaultProps: {},
  },
  [FieldType.DATE]: {
    fieldComponent: InputField,
    defaultProps: {},
  },
  [FieldType.FILE]: {
    fieldComponent: InputField,
    defaultProps: {},
  },
  [FieldType.RADIO_GROUP]: {
    fieldComponent: InputField,
    defaultProps: {},
  },
  [FieldType.MULTI_SELECT]: {
    fieldComponent: MultiSelectField,
    defaultProps: {},
  },
  [FieldType.SELECT]: {
    fieldComponent: InputField,
    defaultProps: {},
  },
  [FieldType.SWITCH]: {
    fieldComponent: InputField,
    defaultProps: {},
  },
  [FieldType.TIME]: {
    fieldComponent: InputField,
    defaultProps: {},
  },
  [FieldType.ARRAY]: {
    fieldComponent: ArrayField,
    defaultProps: {},
  },
  [FieldType.OBJECT]: {
    fieldComponent: ObjectField,
    defaultProps: {},
  },
};

export const DATA_TYPE_POTENTIAL_FIELD = {
  [DataType.STRING]: {
    default: FieldType.TEXT,
    options: [FieldType.TEXT, FieldType.EMAIL, FieldType.PHONE],
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
