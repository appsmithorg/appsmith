import { SwitcherProps, TreeDropdownOption } from "design-system";
import { ENTITY_TYPE, MetaArgs } from "entities/DataTree/types";
import React from "react";
import {
  FieldType,
  ViewTypes,
  AppsmithFunction,
  APPSMITH_GLOBAL_FUNCTIONS,
  APPSMITH_INTEGRATIONS,
  APPSMITH_NAMESPACED_FUNCTIONS,
} from "./constants";
import { FIELD_GROUP_CONFIG } from "./FieldGroup/FieldGroupConfig";

export type GenericFunction = (...args: any[]) => any;

export type SwitchType = {
  id: string;
  text: string;
  action: () => void;
};

export type ActionType = typeof AppsmithFunction[keyof typeof AppsmithFunction];

export type ViewType = typeof ViewTypes[keyof typeof ViewTypes];

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
  exampleText: string;
  index?: number;
  additionalAutoComplete?: Record<string, Record<string, unknown>>;
  toolTip?: string;
};

export type TabViewProps = Omit<ViewProps, "get" | "set"> & SwitcherProps;

export type ButtonViewProps = Omit<ViewProps, "get" | "set"> & {
  onClick: () => void;
};

export type FieldConfig = {
  getter: GenericFunction;
  setter: GenericFunction;
  view: ViewType;
};

export type FieldConfigs = Partial<Record<FieldType, FieldConfig>>;

export type ActionCreatorProps = {
  value: string;
  action: string;
  onValueChange: (newValue: string, isUpdatedViaKeyboard: boolean) => void;
  additionalAutoComplete?: Record<string, Record<string, unknown>>;
};

export type Field = {
  field: FieldType;
  value?: string;
  label?: string;
  index?: number;
};

export type SelectorField = {
  field: FieldType;
  getParentValue?: (value: string) => string;
  value: string | undefined;
  label?: string;
};

export type FieldProps = {
  onValueChange: (newValue: string, isUpdatedViaKeyboard: boolean) => void;
  value: string;
  field: Field;
  label?: string;
  widgetOptionTree: TreeDropdownOption[];
  modalDropdownList: TreeDropdownOption[];
  pageDropdownOptions: TreeDropdownOption[];
  integrationOptions: TreeDropdownOption[];
  additionalAutoComplete?: Record<string, Record<string, unknown>>;
  activeNavigateToTab: SwitchType;
  navigateToSwitches: Array<SwitchType>;
  activeTabApiAndQueryCallback: SwitchType;
  apiAndQueryCallbackTabSwitches: SwitchType[];
};

export type FieldGroupProps = Omit<
  FieldProps,
  | "field"
  | "activeNavigateToTab"
  | "navigateToSwitches"
  | "activeTabApiAndQueryCallback"
  | "apiAndQueryCallbackTabSwitches"
> & {
  isChainedAction?: boolean;
};

export type OptionListType = { label: string; value: string; id: string };

export type AppsmithFunctionConfigValues = {
  label: (args: FieldProps) => string;
  defaultText: string;
  options: (args: FieldProps) => null | TreeDropdownOption[] | OptionListType;
  getter: (arg1: string, arg2?: number) => string;
  setter: (
    arg1: string | TreeDropdownOption,
    arg2: string,
    arg3?: number,
  ) => string;
  view: ViewType;
  exampleText: string;
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

export type FieldGroupValueType = {
  label: string;
  fields: string[];
  defaultParams: string;
  value?: string;
  children?: TreeDropdownOption[];
};

export type FieldGroupConfig = {
  [key: string]: FieldGroupValueType;
};

export type ActionTree = {
  code: string;
  actionType: typeof AppsmithFunction[keyof typeof AppsmithFunction];
  successCallbacks: ActionTree[];
  errorCallbacks: ActionTree[];
};

export type SelectedActionBlock = {
  type: "success" | "failure";
  index: number;
};
