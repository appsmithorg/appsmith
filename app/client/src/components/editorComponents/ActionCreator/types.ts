import type { SwitcherProps, TreeDropdownOption } from "design-system-old";
import type { ENTITY_TYPE, MetaArgs } from "entities/DataTree/types";
import type React from "react";
import type { AdditionalDynamicDataTree } from "utils/autocomplete/customTreeTypeDefCreator";
import type { FieldType, ViewTypes, AppsmithFunction } from "./constants";

export type GenericFunction = (...args: any[]) => any;

export type SwitchType = {
  id: string;
  text: string;
  action: () => void;
};

export type ActionType =
  (typeof AppsmithFunction)[keyof typeof AppsmithFunction];

export type ViewType = (typeof ViewTypes)[keyof typeof ViewTypes];

export type ViewProps = {
  label: string;
  get: GenericFunction;
  set: GenericFunction;
  value: string;
};

export type SelectorViewProps = ViewProps & {
  options: TreeDropdownOption[];
  defaultText: string;
  getDefaults?: (value?: any) => any;
  displayValue?: string;
  selectedLabelModifier?: (
    option: TreeDropdownOption,
    displayValue?: string,
  ) => React.ReactNode;
  index?: number;
};

export type KeyValueViewProps = ViewProps;

export type TextViewProps = ViewProps & {
  index?: number;
  additionalAutoComplete?: AdditionalDynamicDataTree;
  toolTip?: string;
};

export type TabViewProps = Omit<ViewProps, "get" | "set"> & SwitcherProps;

export type FieldConfig = {
  getter: GenericFunction;
  setter: GenericFunction;
  view: ViewType;
};

export type FieldConfigs = Partial<Record<FieldType, FieldConfig>>;

export type ActionCreatorProps = {
  value: string;
  onValueChange: (newValue: string, isUpdatedViaKeyboard: boolean) => void;
  additionalAutoComplete?: AdditionalDynamicDataTree;
};

export type Field = {
  field: FieldType;
  value?: string;
  label?: string;
  index?: number;
};

export type FieldProps = {
  onValueChange: (newValue: string, isUpdatedViaKeyboard: boolean) => void;
  value: string;
  field: Field;
  label?: string;
  widgetOptionTree: TreeDropdownOption[];
  modalDropdownList: TreeDropdownOption[];
  pageDropdownOptions: TreeDropdownOption[];
  integrationOptionTree: TreeDropdownOption[];
  depth: number;
  maxDepth: number;
  additionalAutoComplete?: AdditionalDynamicDataTree;
  activeNavigateToTab: SwitchType;
  navigateToSwitches: Array<SwitchType>;
};

export type FieldsProps = Omit<FieldProps, "field"> & {
  fields: Array<Field>;
};

export type OptionListType = { label: string; value: string; id: string };

export type AppsmithFunctionConfigValues = {
  label: (args: FieldProps) => string;
  defaultText: string;
  options: (args: FieldProps) => null | TreeDropdownOption[] | OptionListType;
  getter: (arg1: string, arg2: number) => string;
  setter: (
    arg1: string | TreeDropdownOption,
    arg2: string,
    arg3?: number,
  ) => string;
  view: ViewType;
  toolTip?: string;
};

export type AppsmithFunctionConfigType = {
  [key: string]: AppsmithFunctionConfigValues;
};

export type DataTreeForActionCreator = {
  [key: string]: {
    ENTITY_TYPE?: ENTITY_TYPE;
    meta?: Record<string, MetaArgs>;
  };
};
