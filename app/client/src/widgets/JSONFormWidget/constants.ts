import { ControllerRenderProps } from "react-hook-form/dist/types/controller";

import { InputType } from "widgets/InputWidget/constants";
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
import { TextSize } from "constants/WidgetConstants";

export enum FieldType {
  ARRAY = "Array",
  CHECKBOX = "Checkbox",
  CURRENCY = "Currency",
  DATE = "Date",
  EMAIL = "Email",
  MULTI_SELECT = "Multi-Select",
  NUMBER = "Number",
  OBJECT = "Object",
  PASSWORD = "Password",
  PHONE_NUMBER = "Phone Number",
  RADIO_GROUP = "Radio-Group",
  SELECT = "Select",
  SWITCH = "Switch",
  TEXT = "Text",
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

export type FieldComponentBaseProps = {
  defaultValue?: string | number;
  isDisabled: boolean;
  isRequired?: boolean;
  isVisible: boolean;
  label: string;
  labelStyle?: string;
  labelTextColor?: string;
  labelTextSize?: TextSize;
  tooltip?: string;
};

export type FieldEventProps = {
  onFocus?: string;
  onBlur?: string;
};

export type BaseFieldComponentProps<TProps = any> = {
  hideLabel?: boolean;
  isRootField?: boolean;
  name: ControllerRenderProps["name"];
  propertyPath: string;
  schemaItem: SchemaItem & TProps;
};

export type Schema = Record<string, SchemaItem>;

export type SchemaItem = FieldComponentBaseProps & {
  children: Schema;
  dataType: DataType;
  fieldType: FieldType;
  sourceData: any;
  isCustomField: boolean;
  name: string;
  position: number;
  identifier: string;
  originalIdentifier: string;
};

export type ComponentDefaultValuesFnProps<TSourceData = any> = {
  sourceDataPath?: string;
  fieldType: FieldType;
  bindingTemplate: {
    endTemplate: string;
    startTemplate: string;
  };
  isCustomField: boolean;
  sourceData: TSourceData;
  skipDefaultValueProcessing: boolean;
};

// This defines a react component with componentDefaultValues property attached to it.
type FieldComponent = {
  (props: BaseFieldComponentProps): JSX.Element | null;
  componentDefaultValues:
    | FieldComponentBaseProps
    | ((props: ComponentDefaultValuesFnProps) => FieldComponentBaseProps);
  isValidType?: (value: any, options?: any) => boolean;
};

export type FieldState<TObj> =
  | {
      [k: string]: TObj | TObj[] | FieldState<TObj> | FieldState<TObj>[];
    }
  | FieldState<TObj>[];

export const ARRAY_ITEM_KEY = "__array_item__";
export const ROOT_SCHEMA_KEY = "__root_schema__";

export const RESTRICTED_KEYS = [ARRAY_ITEM_KEY, ROOT_SCHEMA_KEY];

export const FIELD_MAP: Record<FieldType, FieldComponent> = {
  [FieldType.ARRAY]: ArrayField,
  [FieldType.CHECKBOX]: CheckboxField,
  [FieldType.CURRENCY]: InputField,
  [FieldType.DATE]: DateField,
  [FieldType.EMAIL]: InputField,
  [FieldType.MULTI_SELECT]: MultiSelectField,
  [FieldType.NUMBER]: InputField,
  [FieldType.OBJECT]: ObjectField,
  [FieldType.PASSWORD]: InputField,
  [FieldType.PHONE_NUMBER]: InputField,
  [FieldType.RADIO_GROUP]: RadioGroupField,
  [FieldType.SELECT]: SelectField,
  [FieldType.SWITCH]: SwitchField,
  [FieldType.TEXT]: InputField,
};

export const INPUT_TYPES = [
  FieldType.CURRENCY,
  FieldType.EMAIL,
  FieldType.NUMBER,
  FieldType.PHONE_NUMBER,
  FieldType.TEXT,
  FieldType.PASSWORD,
] as const;

/**
 * This translates FieldType to Input component inputType
 * As InputField would handle all the below types (Text/Number), this map
 * would help use identify what inputType it is based on the FieldType.
 */
export const INPUT_FIELD_TYPE: Record<typeof INPUT_TYPES[number], InputType> = {
  [FieldType.CURRENCY]: "CURRENCY",
  [FieldType.EMAIL]: "EMAIL",
  [FieldType.NUMBER]: "NUMBER",
  [FieldType.PASSWORD]: "PASSWORD",
  [FieldType.PHONE_NUMBER]: "PHONE_NUMBER",
  [FieldType.TEXT]: "TEXT",
};

export const FIELD_EXPECTING_OPTIONS = [
  FieldType.MULTI_SELECT,
  FieldType.MULTI_SELECT,
  FieldType.RADIO_GROUP,
  FieldType.SELECT,
];

export const DATA_TYPE_POTENTIAL_FIELD = {
  [DataType.STRING]: FieldType.TEXT,
  [DataType.BOOLEAN]: FieldType.SWITCH,
  [DataType.NUMBER]: FieldType.NUMBER,
  [DataType.BIGINT]: FieldType.NUMBER,
  [DataType.SYMBOL]: FieldType.TEXT,
  [DataType.UNDEFINED]: FieldType.TEXT,
  [DataType.NULL]: FieldType.TEXT,
  [DataType.OBJECT]: FieldType.OBJECT,
  [DataType.ARRAY]: FieldType.ARRAY,
  [DataType.FUNCTION]: FieldType.TEXT,
};

// The potential value here is just for representation i.e it won't be used to set default value anywhere.
// This will just help to transform a field type (when modified in custom field) to appropriate schemaItem
// using schemaParser.
export const FIELD_TYPE_TO_POTENTIAL_DATA: Record<FieldType, any> = {
  [FieldType.TEXT]: "",
  [FieldType.NUMBER]: 0,
  [FieldType.EMAIL]: "",
  [FieldType.PASSWORD]: "",
  [FieldType.CURRENCY]: "",
  [FieldType.PHONE_NUMBER]: "",
  [FieldType.CHECKBOX]: true,
  [FieldType.DATE]: "",
  [FieldType.RADIO_GROUP]: "",
  [FieldType.MULTI_SELECT]: [],
  [FieldType.SELECT]: "",
  [FieldType.SWITCH]: true,
  [FieldType.ARRAY]: [{ firstField: "" }],
  [FieldType.OBJECT]: {},
};

export const FIELD_SUPPORTING_FOCUS_EVENTS = [
  FieldType.TEXT,
  FieldType.NUMBER,
  FieldType.EMAIL,
  FieldType.PASSWORD,
  FieldType.CURRENCY,
  FieldType.PHONE_NUMBER,
  FieldType.CHECKBOX,
  FieldType.DATE,
  FieldType.MULTI_SELECT,
];

export const getBindingTemplate = (widgetName: string) => {
  const startTemplate = `{{((sourceData, formData, fieldState) => (`;
  const endTemplate = `))(${widgetName}.sourceData, ${widgetName}.formData, ${widgetName}.fieldState)}}`;

  return { startTemplate, endTemplate };
};
