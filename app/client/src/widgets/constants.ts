import { IconNames } from "@blueprintjs/icons";
import { PropertyPaneConfig } from "constants/PropertyControlConstants";
import { WIDGET_STATIC_PROPS } from "constants/WidgetConstants";
import { omit } from "lodash";
import { WidgetConfigProps } from "reducers/entityReducers/widgetConfigReducer";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import { WidgetFeatures } from "utils/WidgetFeatures";
import { WidgetProps } from "./BaseWidget";

export interface WidgetConfiguration {
  type: string;
  name: string;
  iconSVG?: string;
  defaults: Partial<WidgetProps> & WidgetConfigProps;
  hideCard?: boolean;
  isDeprecated?: boolean;
  replacement?: string;
  isCanvas?: boolean;
  needsMeta?: boolean;
  features?: WidgetFeatures;
  searchTags?: string[];
  properties: {
    config: PropertyPaneConfig[];
    contentConfig?: PropertyPaneConfig[];
    styleConfig?: PropertyPaneConfig[];
    default: Record<string, string>;
    meta: Record<string, any>;
    derived: DerivedPropertiesMap;
    loadingProperties?: Array<RegExp>;
  };
}

export const GRID_DENSITY_MIGRATION_V1 = 4;

export enum BlueprintOperationTypes {
  MODIFY_PROPS = "MODIFY_PROPS",
  ADD_ACTION = "ADD_ACTION",
  CHILD_OPERATIONS = "CHILD_OPERATIONS",
}

export type FlattenedWidgetProps = WidgetProps & {
  children?: string[];
};

export interface DSLWidget extends WidgetProps {
  children?: DSLWidget[];
}

const staticProps = omit(WIDGET_STATIC_PROPS, "children");
export type CanvasWidgetStructure = Pick<
  WidgetProps,
  keyof typeof staticProps
> & {
  children?: CanvasWidgetStructure[];
};

export enum FileDataTypes {
  Base64 = "Base64",
  Text = "Text",
  Binary = "Binary",
}

export type AlignWidget = "LEFT" | "RIGHT";
export enum AlignWidgetTypes {
  LEFT = "LEFT",
  RIGHT = "RIGHT",
}

// Minimum Rows for Widget Popups
export const MinimumPopupRows = 12;

// Default boxShadowColor used in theming migration
export const rgbaMigrationConstantV56 = "rgba(0, 0, 0, 0.25)";

export const BUTTON_GROUP_CHILD_STYLESHEET = {
  button: {
    buttonColor: "{{appsmith.theme.colors.primaryColor}}",
  },
};

export const TABLE_WIDGET_CHILD_STYLESHEET = {
  button: {
    buttonColor: "{{appsmith.theme.colors.primaryColor}}",
    borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
    boxShadow: "none",
  },
  menuButton: {
    menuColor: "{{appsmith.theme.colors.primaryColor}}",
    borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
    boxShadow: "none",
  },
  iconButton: {
    menuColor: "{{appsmith.theme.colors.primaryColor}}",
    borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
    boxShadow: "none",
  },
};

export const JSON_FORM_WIDGET_CHILD_STYLESHEET = {
  ARRAY: {
    accentColor: "{{appsmith.theme.colors.primaryColor}}",
    borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
    boxShadow: "none",
    cellBorderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
    cellBoxShadow: "none",
  },
  OBJECT: {
    borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
    boxShadow: "none",
    cellBorderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
    cellBoxShadow: "none",
  },
  CHECKBOX: {
    accentColor: "{{appsmith.theme.colors.primaryColor}}",
    borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
  },
  CURRENCY_INPUT: {
    accentColor: "{{appsmith.theme.colors.primaryColor}}",
    borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
    boxShadow: "none",
  },
  DATEPICKER: {
    accentColor: "{{appsmith.theme.colors.primaryColor}}",
    borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
    boxShadow: "none",
  },
  EMAIL_INPUT: {
    accentColor: "{{appsmith.theme.colors.primaryColor}}",
    borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
    boxShadow: "none",
  },
  MULTISELECT: {
    accentColor: "{{appsmith.theme.colors.primaryColor}}",
    borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
    boxShadow: "none",
  },
  MULTILINE_TEXT_INPUT: {
    accentColor: "{{appsmith.theme.colors.primaryColor}}",
    borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
    boxShadow: "none",
  },
  NUMBER_INPUT: {
    accentColor: "{{appsmith.theme.colors.primaryColor}}",
    borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
    boxShadow: "none",
  },
  PASSWORD_INPUT: {
    accentColor: "{{appsmith.theme.colors.primaryColor}}",
    borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
    boxShadow: "none",
  },
  PHONE_NUMBER_INPUT: {
    accentColor: "{{appsmith.theme.colors.primaryColor}}",
    borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
    boxShadow: "none",
  },
  RADIO_GROUP: {
    accentColor: "{{appsmith.theme.colors.primaryColor}}",
    boxShadow: "none",
  },
  SELECT: {
    accentColor: "{{appsmith.theme.colors.primaryColor}}",
    borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
    boxShadow: "none",
  },
  SWITCH: {
    accentColor: "{{appsmith.theme.colors.primaryColor}}",
    boxShadow: "none",
  },
  TEXT_INPUT: {
    accentColor: "{{appsmith.theme.colors.primaryColor}}",
    borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
    boxShadow: "none",
  },
};

export const YOUTUBE_URL_REGEX = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|\?v=)([^#&?]*).*/;

export const ICON_NAMES = Object.keys(IconNames).map(
  (name: string) => IconNames[name as keyof typeof IconNames],
);
