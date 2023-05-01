import type {
  SwitcherProps,
  TreeDropdownOption,
  IconName,
} from "design-system-old";
import type { ENTITY_TYPE, MetaArgs } from "entities/DataTree/types";
import type React from "react";
import type { AdditionalDynamicDataTree } from "utils/autocomplete/customTreeTypeDefCreator";
import type { FieldType, ViewTypes, AppsmithFunction } from "./constants";
import type { APPSMITH_INTEGRATIONS } from "./constants";
import type { Variants } from "./constants";

export type GenericFunction = (...args: any[]) => any;

export type SwitchType = {
  id: string;
  text: string;
  action: () => void;
};

export type ActionIntegrationType =
  (typeof APPSMITH_INTEGRATIONS)[keyof typeof APPSMITH_INTEGRATIONS];

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
  exampleText: string;
  index?: number;
  additionalAutoComplete?: AdditionalDynamicDataTree;
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
  additionalAutoComplete?: AdditionalDynamicDataTree;
  additionalControlData: Record<string, any>;
};

export type Field = {
  field: FieldType;
  value?: string;
  label?: string;
  index?: number;
  position?: number;
  getter?: (value: string) => string;
  setter?: (value: string, newValue: string) => string;
};

export type SelectorField = {
  field: FieldType;
  getParentValue?: (value: string) => string;
  value: string | undefined;
  label?: string;
};

export type FieldProps = {
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
  icon?: IconName;
};

export type FieldGroupConfig = {
  [key: string]: FieldGroupValueType;
};

export interface CallbackBlock extends ActionTree {
  type: "success" | "failure" | "then" | "catch";
}

export type ActionTree = {
  code: string;
  actionType: (typeof AppsmithFunction)[keyof typeof AppsmithFunction];
  successBlocks: CallbackBlock[];
  errorBlocks: CallbackBlock[];
};

export type SelectedActionBlock = {
  type: "success" | "failure";
  index: number;
};

export type TActionBlock = {
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
};

export type VariantType = keyof typeof Variants;
