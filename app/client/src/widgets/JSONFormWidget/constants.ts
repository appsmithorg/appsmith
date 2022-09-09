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

// CAUTION! When changing the enum value, make sure any direct comparison
// eg fieldType === "Array" instead of fieldType === FieldType.ARRAY is taking place
// and modified accordingly
export enum FieldType {
  ARRAY = "Array",
  CHECKBOX = "Checkbox",
  CURRENCY_INPUT = "Currency Input",
  DATEPICKER = "Datepicker",
  EMAIL_INPUT = "Email Input",
  MULTISELECT = "Multiselect",
  MULTILINE_TEXT_INPUT = "Multiline Text Input",
  NUMBER_INPUT = "Number Input",
  OBJECT = "Object",
  PASSWORD_INPUT = "Password Input",
  PHONE_NUMBER_INPUT = "Phone Number Input",
  RADIO_GROUP = "Radio Group",
  SELECT = "Select",
  SWITCH = "Switch",
  TEXT_INPUT = "Text Input",
}

export type FieldTypeKey = keyof typeof FieldType;

export const inverseFieldType = Object.entries(FieldType).reduce<
  Record<FieldType, FieldTypeKey>
>((previousValue, currentValue) => {
  const [key, value] = currentValue;
  previousValue[value] = key as FieldTypeKey;
  return previousValue;
}, {} as Record<FieldType, FieldTypeKey>);

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

export type Obj = Record<string, any>;
export type JSON = Obj | Obj[];

export type FieldComponentBaseProps = {
  defaultValue?: string | number;
  isDisabled: boolean;
  isRequired?: boolean;
  isVisible: boolean;
  label: string;
  labelStyle?: string;
  labelTextColor?: string;
  labelTextSize?: string;
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
  originalIdentifier: string;
  position: number;
  sourceData: any;
};

export type ComponentDefaultValuesFnProps<TSourceData = any> = {
  sourceDataPath?: string;
  fieldType: FieldType;
  bindingTemplate: {
    suffixTemplate: string;
    prefixTemplate: string;
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
  | FieldState<TObj>[]
  | TObj;

export type HookResponse =
  | Array<{ propertyPath: string; propertyValue: any }>
  | undefined;

export type FieldThemeStylesheet = Record<
  FieldTypeKey,
  { [key: string]: string }
>;

export enum ActionUpdateDependency {
  FORM_DATA = "FORM_DATA",
}

export const ARRAY_ITEM_KEY = "__array_item__";
export const ROOT_SCHEMA_KEY = "__root_schema__";

export const MAX_ALLOWED_FIELDS = 50;

export const RESTRICTED_KEYS = [ARRAY_ITEM_KEY, ROOT_SCHEMA_KEY];

export const FIELD_MAP: Record<FieldType, FieldComponent> = {
  [FieldType.ARRAY]: ArrayField,
  [FieldType.CHECKBOX]: CheckboxField,
  [FieldType.CURRENCY_INPUT]: CurrencyInputField,
  [FieldType.DATEPICKER]: DateField,
  [FieldType.EMAIL_INPUT]: InputField,
  [FieldType.MULTISELECT]: MultiSelectField,
  [FieldType.MULTILINE_TEXT_INPUT]: InputField,
  [FieldType.NUMBER_INPUT]: InputField,
  [FieldType.OBJECT]: ObjectField,
  [FieldType.PASSWORD_INPUT]: InputField,
  [FieldType.PHONE_NUMBER_INPUT]: PhoneInputField,
  [FieldType.RADIO_GROUP]: RadioGroupField,
  [FieldType.SELECT]: SelectField,
  [FieldType.SWITCH]: SwitchField,
  [FieldType.TEXT_INPUT]: InputField,
};

export const INPUT_TYPES = [
  FieldType.CURRENCY_INPUT,
  FieldType.EMAIL_INPUT,
  FieldType.MULTILINE_TEXT_INPUT,
  FieldType.NUMBER_INPUT,
  FieldType.PASSWORD_INPUT,
  FieldType.PHONE_NUMBER_INPUT,
  FieldType.TEXT_INPUT,
] as const;

/**
 * This translates FieldType to Input component inputType
 * As InputField would handle all the below types (Text/Number), this map
 * would help use identify what inputType it is based on the FieldType.
 */
export const INPUT_FIELD_TYPE: Record<typeof INPUT_TYPES[number], InputType> = {
  [FieldType.CURRENCY_INPUT]: "CURRENCY",
  [FieldType.EMAIL_INPUT]: "EMAIL",
  [FieldType.NUMBER_INPUT]: "NUMBER",
  [FieldType.PASSWORD_INPUT]: "PASSWORD",
  [FieldType.PHONE_NUMBER_INPUT]: "PHONE_NUMBER",
  [FieldType.TEXT_INPUT]: "TEXT",
  [FieldType.MULTILINE_TEXT_INPUT]: "TEXT",
};

export const FIELD_EXPECTING_OPTIONS = [
  FieldType.MULTISELECT,
  FieldType.SELECT,
];

export const DATA_TYPE_POTENTIAL_FIELD = {
  [DataType.STRING]: FieldType.TEXT_INPUT,
  [DataType.BOOLEAN]: FieldType.SWITCH,
  [DataType.NUMBER]: FieldType.NUMBER_INPUT,
  [DataType.BIGINT]: FieldType.NUMBER_INPUT,
  [DataType.SYMBOL]: FieldType.TEXT_INPUT,
  [DataType.UNDEFINED]: FieldType.TEXT_INPUT,
  [DataType.NULL]: FieldType.TEXT_INPUT,
  [DataType.OBJECT]: FieldType.OBJECT,
  [DataType.ARRAY]: FieldType.ARRAY,
  [DataType.FUNCTION]: FieldType.TEXT_INPUT,
};

// The potential value here is just for representation i.e it won't be used to set default value anywhere.
// This will just help to transform a field type (when modified in custom field) to appropriate schemaItem
// using schemaParser.
export const FIELD_TYPE_TO_POTENTIAL_DATA: Record<FieldType, any> = {
  [FieldType.ARRAY]: [{ firstField: "" }],
  [FieldType.CHECKBOX]: true,
  [FieldType.CURRENCY_INPUT]: "",
  [FieldType.DATEPICKER]: "",
  [FieldType.EMAIL_INPUT]: "",
  [FieldType.MULTISELECT]: [],
  [FieldType.MULTILINE_TEXT_INPUT]: "",
  [FieldType.NUMBER_INPUT]: 0,
  [FieldType.OBJECT]: {},
  [FieldType.PASSWORD_INPUT]: "",
  [FieldType.PHONE_NUMBER_INPUT]: "",
  [FieldType.RADIO_GROUP]: "",
  [FieldType.SELECT]: "",
  [FieldType.SWITCH]: true,
  [FieldType.TEXT_INPUT]: "",
};

export const FIELD_SUPPORTING_FOCUS_EVENTS = [
  FieldType.CHECKBOX,
  FieldType.CURRENCY_INPUT,
  FieldType.DATEPICKER,
  FieldType.EMAIL_INPUT,
  FieldType.MULTISELECT,
  FieldType.MULTILINE_TEXT_INPUT,
  FieldType.NUMBER_INPUT,
  FieldType.PASSWORD_INPUT,
  FieldType.PHONE_NUMBER_INPUT,
  FieldType.TEXT_INPUT,
];

// These are the fields who's defaultValue property control's JS
// mode would be enabled by default.
export const AUTO_JS_ENABLED_FIELDS: Record<
  FieldType,
  (keyof SchemaItem)[] | null
> = {
  [FieldType.DATEPICKER]: ["defaultValue"],
  [FieldType.SWITCH]: ["defaultValue"],
  [FieldType.ARRAY]: null,
  [FieldType.CHECKBOX]: ["defaultValue"],
  [FieldType.CURRENCY_INPUT]: null,
  [FieldType.EMAIL_INPUT]: null,
  [FieldType.MULTISELECT]: null,
  [FieldType.MULTILINE_TEXT_INPUT]: null,
  [FieldType.NUMBER_INPUT]: null,
  [FieldType.OBJECT]: null,
  [FieldType.PASSWORD_INPUT]: null,
  [FieldType.PHONE_NUMBER_INPUT]: null,
  [FieldType.RADIO_GROUP]: null,
  [FieldType.SELECT]: null,
  [FieldType.TEXT_INPUT]: null,
};

export const getBindingTemplate = (widgetName: string) => {
  const prefixTemplate = `{{((sourceData, formData, fieldState) => (`;
  const suffixTemplate = `))(${widgetName}.sourceData, ${widgetName}.formData, ${widgetName}.fieldState)}}`;

  return { prefixTemplate, suffixTemplate };
};
