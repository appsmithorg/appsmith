import type React from "react";
import type { ReduxAction } from "actions/ReduxActionTypes";
import type { Dispatch } from "react";
import type { RadioOptionProps } from "pages/AdminSettings/FormGroup/Radio";
import type { CalloutKind, SelectOptionProps } from "@appsmith/ads";

type ControlType = {
  [K in keyof ControlPropsType]: {
    controlType: K;
    controlTypeProps?: ControlPropsType[K];
  };
}[keyof ControlPropsType];

interface ControlPropsType {
  [SettingTypes.RADIO]: RadioOptionProps;
  [SettingTypes.TEXTINPUT]: unknown;
  [SettingTypes.TOGGLE]: unknown;
  [SettingTypes.LINK]: unknown;
  [SettingTypes.CALLOUT]: unknown;
  [SettingTypes.BUTTON]: unknown;
  [SettingTypes.GROUP]: unknown;
  [SettingTypes.TEXT]: unknown;
  [SettingTypes.UNEDITABLEFIELD]: unknown;
  [SettingTypes.ACCORDION]: unknown;
  [SettingTypes.TAGINPUT]: unknown;
  [SettingTypes.DROPDOWN]: unknown;
  [SettingTypes.CHECKBOX]: unknown;
}

export enum SettingTypes {
  RADIO = "RADIO",
  TEXTINPUT = "TEXTINPUT",
  TOGGLE = "TOGGLE",
  LINK = "LINK",
  CALLOUT = "CALLOUT",
  BUTTON = "BUTTON",
  GROUP = "GROUP",
  TEXT = "TEXT",
  PAGE = "PAGE",
  UNEDITABLEFIELD = "UNEDITABLEFIELD",
  ACCORDION = "ACCORDION",
  TAGINPUT = "TAGINPUT",
  DROPDOWN = "DROPDOWN",
  CHECKBOX = "CHECKBOX",
}

export enum SettingSubtype {
  EMAIL = "email",
  TEXT = "text",
  NUMBER = "number",
  PASSWORD = "password",
}

export type Setting = ControlType & {
  id: string;
  category?: string;
  controlSubType?: SettingSubtype;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  format?: (value: any) => any;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parse?: (value: any) => any;
  helpText?: string;
  label?: React.ReactNode;
  name?: string;
  placeholder?: string;
  validate?: (value: string, setting?: Setting) => string | void;
  url?: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children?: any;
  subCategory?: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value?: any;
  text?: string;
  textSuffix?: React.ReactElement;
  action?: (
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dispatch: Dispatch<ReduxAction<any>>,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    settings?: Record<string, any>,
  ) => void;
  sortOrder?: number;
  subText?: string;
  subTextLink?: string;
  toggleText?: (value: boolean) => string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isVisible?: (values?: Record<string, any>) => boolean;
  isHidden?: boolean;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isDisabled?: (values?: Record<string, any>) => boolean;
  calloutType?: CalloutKind;
  advanced?: Setting[];
  isRequired?: boolean;
  formName?: string;
  fieldName?: string;
  dropdownOptions?: Partial<SelectOptionProps>[];
  isFeatureEnabled?: boolean;
  tooltip?: string;
  isEnterprise?: boolean;
  postfix?: string;
};

export interface Category {
  title: string;
  slug: string;
  subText?: string;
  isConnected?: boolean;
  needsRefresh?: boolean;
  children?: Category[];
  icon?: string;
  categoryType: string;
  isEnterprise?: boolean;
  isFeatureEnabled?: boolean;
}

export const SettingCategories = {
  GENERAL: "general",
  EMAIL: "email",
  AUTHENTICATION: "authentication",
  FORM_AUTH: "form-login",
  GOOGLE_AUTH: "google-auth",
  GITHUB_AUTH: "github-auth",
  AUDIT_LOGS: "audit-logs",
  ACCESS_CONTROL: "access-control",
  PROVISIONING: "provisioning",
  BRANDING: "branding",
  SAML_AUTH: "saml-auth",
  OIDC_AUTH: "oidc-auth",
  INSTANCE_SETTINGS: "instance-settings",
  CONFIGURATION: "configuration",
  VERSION: "version",
  USER_SETTINGS: "user-settings",
  PROFILE: "profile",
};

export enum CategoryType {
  PROFILE = "profile",
  ORGANIZATION = "organization",
  USER_MANAGEMENT = "user-management",
  INSTANCE = "instance",
}

export interface AdminConfigType {
  type: string;
  controlType: SettingTypes;
  title: string;
  subText?: string;
  settings?: Setting[];
  component?: React.ElementType;
  children?: AdminConfigType[];
  canSave: boolean;
  isConnected?: boolean;
  needsRefresh?: boolean;
  icon?: string;
  categoryType: CategoryType;
  isEnterprise?: boolean;
  isFeatureEnabled?: boolean;
}
