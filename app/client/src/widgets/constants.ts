import { IconNames } from "@blueprintjs/icons";
import { PropertyPaneConfig } from "constants/PropertyControlConstants";
import { WIDGET_STATIC_PROPS } from "constants/WidgetConstants";
import { Theme } from "constants/DefaultTheme";
import { omit } from "lodash";
import { WidgetConfigProps } from "reducers/entityReducers/widgetConfigReducer";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import { WidgetFeatures } from "utils/WidgetFeatures";
import { WidgetProps } from "./BaseWidget";
import moment from "moment";
import { Stylesheet } from "entities/AppTheming";

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
  canvasHeightOffset?: (props: WidgetProps) => number;
  searchTags?: string[];
  properties: {
    config?: PropertyPaneConfig[];
    contentConfig?: PropertyPaneConfig[];
    styleConfig?: PropertyPaneConfig[];
    default: Record<string, string>;
    meta: Record<string, any>;
    derived: DerivedPropertiesMap;
    loadingProperties?: Array<RegExp>;
    stylesheetConfig?: Stylesheet;
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
  Array = "Array",
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

export const dateFormatOptions = [
  {
    label: moment().format("YYYY-MM-DDTHH:mm:ss.sssZ"),
    subText: "ISO 8601",
    value: "YYYY-MM-DDTHH:mm:ss.sssZ",
  },
  {
    label: moment().format("LLL"),
    subText: "LLL",
    value: "LLL",
  },
  {
    label: moment().format("LL"),
    subText: "LL",
    value: "LL",
  },
  {
    label: moment().format("YYYY-MM-DD HH:mm"),
    subText: "YYYY-MM-DD HH:mm",
    value: "YYYY-MM-DD HH:mm",
  },
  {
    label: moment().format("YYYY-MM-DDTHH:mm:ss"),
    subText: "YYYY-MM-DDTHH:mm:ss",
    value: "YYYY-MM-DDTHH:mm:ss",
  },
  {
    label: moment().format("YYYY-MM-DD hh:mm:ss A"),
    subText: "YYYY-MM-DD hh:mm:ss A",
    value: "YYYY-MM-DD hh:mm:ss A",
  },
  {
    label: moment().format("DD/MM/YYYY HH:mm"),
    subText: "DD/MM/YYYY HH:mm",
    value: "DD/MM/YYYY HH:mm",
  },
  {
    label: moment().format("D MMMM, YYYY"),
    subText: "D MMMM, YYYY",
    value: "D MMMM, YYYY",
  },
  {
    label: moment().format("H:mm A D MMMM, YYYY"),
    subText: "H:mm A D MMMM, YYYY",
    value: "H:mm A D MMMM, YYYY",
  },
  {
    label: moment().format("YYYY-MM-DD"),
    subText: "YYYY-MM-DD",
    value: "YYYY-MM-DD",
  },
  {
    label: moment().format("MM-DD-YYYY"),
    subText: "MM-DD-YYYY",
    value: "MM-DD-YYYY",
  },
  {
    label: moment().format("DD-MM-YYYY"),
    subText: "DD-MM-YYYY",
    value: "DD-MM-YYYY",
  },
  {
    label: moment().format("MM/DD/YYYY"),
    subText: "MM/DD/YYYY",
    value: "MM/DD/YYYY",
  },
  {
    label: moment().format("DD/MM/YYYY"),
    subText: "DD/MM/YYYY",
    value: "DD/MM/YYYY",
  },
  {
    label: moment().format("DD/MM/YY"),
    subText: "DD/MM/YY",
    value: "DD/MM/YY",
  },
  {
    label: moment().format("MM/DD/YY"),
    subText: "MM/DD/YY",
    value: "MM/DD/YY",
  },
];

export type ThemeProp = {
  theme: Theme;
};
