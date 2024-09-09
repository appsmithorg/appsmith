import type { SwitcherProps, TreeDropdownOption } from "@appsmith/ads-old";
import type { IconNames } from "@appsmith/ads";
import type { EntityTypeValue, MetaArgs } from "ee/entities/DataTree/types";
import type React from "react";
import type { AdditionalDynamicDataTree } from "utils/autocomplete/customTreeTypeDefCreator";
import type { FieldType, ViewTypes, AppsmithFunction } from "./constants";
import type { APPSMITH_INTEGRATIONS } from "./constants";
import type { Variants } from "./constants";
import type { MODULE_TYPE } from "ee/constants/ModuleConstants";

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GenericFunction = (...args: any[]) => any;

export interface SwitchType {
  id: string;
  text: string;
  action: () => void;
}

export type ActionIntegrationType =
  (typeof APPSMITH_INTEGRATIONS)[keyof typeof APPSMITH_INTEGRATIONS];

export type ActionType =
  (typeof AppsmithFunction)[keyof typeof AppsmithFunction];

export type ViewType = (typeof ViewTypes)[keyof typeof ViewTypes];

export interface ViewProps {
  label: string;
  get: GenericFunction;
  set: GenericFunction;
  value: string;
}

export type SelectorViewProps = ViewProps & {
  options: TreeDropdownOption[];
  defaultText: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  additionalAutoComplete?: AdditionalDynamicDataTree;
  toolTip?: string;
  dataTreePath?: string | undefined;
  isValueChanged?: (value: string) => boolean;
};

export type TabViewProps = Omit<ViewProps, "get" | "set"> & SwitcherProps;

export type ButtonViewProps = Omit<ViewProps, "get" | "set"> & {
  onClick: () => void;
};

export interface FieldConfig {
  getter: GenericFunction;
  setter: GenericFunction;
  view: ViewType;
}

export type FieldConfigs = Partial<Record<FieldType, FieldConfig>>;

export interface ActionCreatorProps {
  value: string;
  action: string;
  onValueChange: (newValue: string, isUpdatedViaKeyboard: boolean) => void;
  additionalAutoComplete?: AdditionalDynamicDataTree;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  additionalControlData: Record<string, any>;
  propertyName: string;
  widgetType: string;
  widgetName: string;
  dataTreePath: string | undefined;
}

export interface Field {
  field: FieldType;
  value?: string;
  label?: string;
  index?: number;
  position?: number;
  getter?: (value: string) => string;
  setter?: (value: string, newValue: string) => string;
}

export interface SelectorField {
  field: FieldType;
  getParentValue?: (value: string) => string;
  value: string | undefined;
  label?: string;
}

export interface FieldProps {
  onValueChange: (
    newValue: string,
    isUpdatedViaKeyboard: boolean,
    argsUpdate?: boolean,
  ) => void;
  value: string;
  field: Field;
  label?: string;
  widgetOptionTree: TreeDropdownOption[];
  modalDropdownList: TreeDropdownOption[];
  pageDropdownOptions: TreeDropdownOption[];
  integrationOptions: TreeDropdownOption[];
  additionalAutoComplete?: AdditionalDynamicDataTree;
  activeNavigateToTab: SwitchType;
  navigateToSwitches: Array<SwitchType>;
  activeTabApiAndQueryCallback: SwitchType;
  apiAndQueryCallbackTabSwitches: SwitchType[];
  dataTreePath?: string | undefined;
}

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

export interface OptionListType {
  label: string;
  value: string;
  id: string;
}

export interface AppsmithFunctionConfigValues {
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
}

export interface AppsmithFunctionConfigType {
  [key: string]: AppsmithFunctionConfigValues;
}

export interface DataTreeForActionCreator {
  [key: string]: {
    ENTITY_TYPE?: EntityTypeValue;
    meta?: Record<string, MetaArgs>;
    type?: MODULE_TYPE;
  };
}

export interface FieldGroupValueType {
  label: string;
  fields: string[];
  defaultParams: string;
  value?: string;
  children?: TreeDropdownOption[];
  icon?: IconNames;
}

export interface FieldGroupConfig {
  [key: string]: FieldGroupValueType;
}

export interface CallbackBlock extends ActionTree {
  type: "success" | "failure" | "then" | "catch";
}

export interface ActionTree {
  code: string;
  actionType: (typeof AppsmithFunction)[keyof typeof AppsmithFunction];
  successBlocks: CallbackBlock[];
  errorBlocks: CallbackBlock[];
}

export interface SelectedActionBlock {
  type: "success" | "failure";
  index: number;
}

export interface TActionBlock {
  code: string;
  actionType: (typeof AppsmithFunction)[keyof typeof AppsmithFunction];
  success: {
    params?: string[];
    blocks: TActionBlock[];
  };
  error: {
    params?: string[];
    blocks: TActionBlock[];
  };
  type?: "success" | "failure" | "then" | "catch";
}

export type VariantType = keyof typeof Variants;
