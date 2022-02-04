import React from "react";
import { ReduxAction } from "constants/ReduxActionConstants";
import { Dispatch } from "react";

export enum SettingTypes {
  TEXTINPUT = "TEXTINPUT",
  TOGGLE = "TOGGLE",
  LINK = "LINK",
  BUTTON = "BUTTON",
  GROUP = "GROUP",
  TEXT = "TEXT",
  PAGE = "PAGE",
}

export enum SettingSubtype {
  EMAIL = "email",
  TEXT = "text",
  NUMBER = "number",
  PASSWORD = "password",
}

export interface Setting {
  id: string;
  category?: string;
  controlType: SettingTypes;
  controlSubType?: SettingSubtype;
  helpText?: string;
  label?: string;
  name?: string;
  placeholder?: string;
  validate?: (value: string, setting?: Setting) => string | void;
  url?: string;
  children?: any;
  subCategory?: string;
  value?: string;
  text?: string;
  action?: (
    dispatch: Dispatch<ReduxAction<any>>,
    settings?: Record<string, any>,
  ) => void;
  sortOrder?: number;
  subText?: string;
  toggleText?: (value: boolean) => string;
  isVisible?: (values: Record<string, any>) => boolean;
  isHidden?: boolean;
  isDisabled?: (values: Record<string, any>) => boolean;
}

export interface Category {
  title: string;
  slug: string;
  subText?: string;
  children?: Category[];
}

export const SettingCategories = {
  GENERAL: "general",
  EMAIL: "email",
  GOOGLE_MAPS: "google-maps",
  VERSION: "version",
  ADVANCED: "advanced",
  AUTHENTICATION: "authentication",
  FORM_AUTH: "form-login",
  GOOGLE_AUTH: "google-auth",
  GITHUB_AUTH: "github-auth",
};

export type AdminConfigType = {
  type: string;
  controlType: SettingTypes;
  title: string;
  subText?: string;
  settings?: Setting[];
  component?: React.ElementType;
  children?: AdminConfigType[];
  canSave: boolean;
};
