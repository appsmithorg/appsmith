import { ControllerRenderProps } from "react-hook-form/dist/types/controller";

import { InputType } from "widgets/InputWidget/constants";
import {
  ArrayField,
  CheckboxField,
  CurrencyInputField,
  DateField,
  InputField,
  MultiSelectField,
  ObjectField,
  PhoneInputField,
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
  MULTILINE = "Multiline",
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
  fieldClassName: string;
  name: ControllerRenderProps["name"];
  propertyPath: string;
  passedDefaultValue?: unknown;
  schemaItem: SchemaItem & TProps;
};

export type Schema = Record<string, SchemaItem>;

/**
 * dataType - result of "typeof value" -> string/number/boolean etc.
 * fieldType - the field component that this represents -> Text/Switch/Email etc.
 * sourceData - the data that is used to compute initial dataType and fieldType.
 * isCustomField - this is set to true only for fields created using the "Add new field" in Property Pane
 * name - this is a sanitized value used to identify a field uniquely -> firstName, age etc.
 * position - a number from 0..n specifying the order in a form.
 * originalIdentifier - This is derived from the sourceData key, in it's unsanitized form.
 *    It is used as a marker to identify this field in the sourceData to detect any change. As the actual
 *    identifier used can be modified during sanitization process.
 * identifier - This is derived from the sourceData key, in it's sanitized form. This acts as a marker
 *    in the schema and helps identifying from nested property changes.
 * accessor - This is very similar to the name property. This is directly exposed in the property pane to be
 *    modified at free will. It acts as a staging state for the name, as name cannot have invalid values. So
 *    when accessor is updated, it checks if this value can be used as name and then updates it, else keeps the
 *    name property intact for data sanity.
 */
export type SchemaItem = FieldComponentBaseProps & {
  accessor: string;
  children: Schema;
  dataType: DataType;
  fieldType: FieldType;
  identifier: string;
  isCustomField: boolean;
  name: string;
  originalIdentifier: string;
  position: number;
  sourceData: any;
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
export type FieldComponent = {
  (props: BaseFieldComponentProps): JSX.Element | null;
  componentDefaultValues?:
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
  [FieldType.CURRENCY]: CurrencyInputField,
  [FieldType.DATE]: DateField,
  [FieldType.EMAIL]: InputField,
  [FieldType.MULTI_SELECT]: MultiSelectField,
  [FieldType.MULTILINE]: InputField,
  [FieldType.NUMBER]: InputField,
  [FieldType.OBJECT]: ObjectField,
  [FieldType.PASSWORD]: InputField,
  [FieldType.PHONE_NUMBER]: PhoneInputField,
  [FieldType.RADIO_GROUP]: RadioGroupField,
  [FieldType.SELECT]: SelectField,
  [FieldType.SWITCH]: SwitchField,
  [FieldType.TEXT]: InputField,
};

export const INPUT_TYPES = [
  FieldType.CURRENCY,
  FieldType.EMAIL,
  FieldType.MULTILINE,
  FieldType.NUMBER,
  FieldType.PASSWORD,
  FieldType.PHONE_NUMBER,
  FieldType.TEXT,
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
  [FieldType.MULTILINE]: "TEXT",
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
  [FieldType.ARRAY]: [{ firstField: "" }],
  [FieldType.CHECKBOX]: true,
  [FieldType.CURRENCY]: "",
  [FieldType.DATE]: "",
  [FieldType.EMAIL]: "",
  [FieldType.MULTI_SELECT]: [],
  [FieldType.MULTILINE]: "",
  [FieldType.NUMBER]: 0,
  [FieldType.OBJECT]: {},
  [FieldType.PASSWORD]: "",
  [FieldType.PHONE_NUMBER]: "",
  [FieldType.RADIO_GROUP]: "",
  [FieldType.SELECT]: "",
  [FieldType.SWITCH]: true,
  [FieldType.TEXT]: "",
};

export const FIELD_SUPPORTING_FOCUS_EVENTS = [
  FieldType.CHECKBOX,
  FieldType.CURRENCY,
  FieldType.DATE,
  FieldType.EMAIL,
  FieldType.MULTI_SELECT,
  FieldType.MULTILINE,
  FieldType.NUMBER,
  FieldType.PASSWORD,
  FieldType.PHONE_NUMBER,
  FieldType.TEXT,
];

// These are the fields who's defaultValue property control's JS
// mode would be enabled by default.
export const AUTO_JS_ENABLED_FIELDS: Record<
  FieldType,
  (keyof SchemaItem)[] | null
> = {
  [FieldType.DATE]: ["defaultValue"],
  [FieldType.SWITCH]: ["defaultValue"],
  [FieldType.ARRAY]: null,
  [FieldType.CHECKBOX]: ["defaultValue"],
  [FieldType.CURRENCY]: null,
  [FieldType.EMAIL]: null,
  [FieldType.MULTI_SELECT]: null,
  [FieldType.MULTILINE]: null,
  [FieldType.NUMBER]: null,
  [FieldType.OBJECT]: null,
  [FieldType.PASSWORD]: null,
  [FieldType.PHONE_NUMBER]: null,
  [FieldType.RADIO_GROUP]: null,
  [FieldType.SELECT]: null,
  [FieldType.TEXT]: null,
};

export const getBindingTemplate = (widgetName: string) => {
  const startTemplate = `{{((sourceData, formData, fieldState) => (`;
  const endTemplate = `))(${widgetName}.sourceData, ${widgetName}.formData, ${widgetName}.fieldState)}}`;

  return { startTemplate, endTemplate };
};
