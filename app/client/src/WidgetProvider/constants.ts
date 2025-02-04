/*
 * TODO: (Balaji) Move all the types to different file
 */
import { IconNames } from "@blueprintjs/icons";
import type { SpacingDimension } from "@appsmith/wds";
import type { Responsive, SizingDimension } from "@appsmith/wds";
import type { Theme } from "constants/DefaultTheme";
import type { PropertyPaneConfig } from "constants/PropertyControlConstants";
import type { WidgetTags } from "constants/WidgetConstants";
import { WIDGET_STATIC_PROPS } from "constants/WidgetConstants";
import type { Stylesheet } from "entities/AppTheming";
import { omit } from "lodash";
import { format } from "date-fns";
import type { SVGProps } from "react";
import type { WidgetFeatures } from "utils/WidgetFeatures";
import type { WidgetProps } from "../widgets/BaseWidget";
import type { WidgetEntityConfig } from "ee/entities/DataTree/types";
import type {
  WidgetQueryConfig,
  WidgetQueryGenerationConfig,
  WidgetQueryGenerationFormConfig,
} from "WidgetQueryGenerators/types";
import type {
  LayoutDirection,
  Positioning,
  ResponsiveBehavior,
} from "layoutSystems/common/utils/constants";
import type { DerivedPropertiesMap } from "./factory/types";
import type { ExtraDef } from "utils/autocomplete/types";

export interface WidgetSizeConfig {
  viewportMinWidth: number;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  configuration: (props: any) => Record<string, string | number>;
}

interface ResizableValues {
  vertical?: boolean;
  horizontal?: boolean;
}
// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ResizableOptions = ResizableValues | ((props: any) => ResizableValues);
export interface AutoDimensionValues {
  width?: boolean;
  height?: boolean;
}
export type AutoDimensionOptions =
  | AutoDimensionValues // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | ((props: any) => AutoDimensionValues);

export interface AutoLayoutConfig {
  // Indicates if a widgets dimensions should be auto adjusted according to content inside it
  autoDimension?: AutoDimensionOptions;
  // min/max sizes for the widget
  widgetSize?: Array<WidgetSizeConfig>;
  // Indicates if the widgets resize handles should be disabled
  disableResizeHandles?: ResizableOptions;
  // default values for the widget specifi to auto-layout
  defaults?: Partial<WidgetConfigProps>;
  // default values for the properties that are hidden/disabled in auto-layout
  disabledPropsDefaults?: Partial<WidgetProps>;
}
export interface SizeConfig {
  maxHeight?: Responsive<SizingDimension>;
  maxWidth?: Responsive<SizingDimension>;
  minHeight?: Responsive<SizingDimension>;
  minWidth?: Responsive<SizingDimension>;
  paddingTop?: Responsive<SpacingDimension>;
  paddingBottom?: Responsive<SpacingDimension>;
}

export interface AnvilConfig {
  isLargeWidget: boolean;
  // min/max sizes for the widget
  widgetSize?:
    | SizeConfig // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | ((props: any, isPreviewMode: boolean) => SizeConfig);
}

export interface WidgetBaseConfiguration {
  name: string;
  displayOrder?: number;
  iconSVG?: string;
  thumbnailSVG?: string;
  hideCard?: boolean;
  eagerRender?: boolean;
  isDeprecated?: boolean;
  replacement?: string;
  isCanvas?: boolean;
  needsMeta?: boolean;
  searchTags?: string[];
  tags?: WidgetTags[];
  needsHeightForContent?: boolean;

  // Flag to tell platform to disaplay this widget when search key
  // is not matching any widget.
  isSearchWildcard?: boolean;

  // Flag to tell withWidgetProps HOC to inject evaluation errors into the widget
  needsErrorInfo?: boolean;

  onCanvasUI?: {
    selectionBGCSSVar: string;
    focusBGCSSVar: string;
    selectionColorCSSVar: string;
    focusColorCSSVar: string;
    disableParentSelection: boolean;
  };
}

export type WidgetDefaultProps = Partial<WidgetProps> & WidgetConfigProps;

export interface WidgetConfiguration extends WidgetBaseConfiguration {
  autoLayout?: AutoLayoutConfig;
  defaults: WidgetDefaultProps;
  features?: WidgetFeatures;
  properties: {
    config?: PropertyPaneConfig[];
    contentConfig?: PropertyPaneConfig[];
    styleConfig?: PropertyPaneConfig[];
    default: Record<string, string>;
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    meta: Record<string, any>;
    derived: DerivedPropertiesMap;
    loadingProperties?: Array<RegExp>;
    stylesheetConfig?: Stylesheet;
    autocompleteDefinitions?: AutocompletionDefinitions;
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setterConfig?: Record<string, any>;
  };
  methods?: Record<string, WidgetMethods>;
}

export interface PropertyUpdates {
  propertyPath: string;
  propertyValue?: unknown;
  isDynamicPropertyPath?: boolean; // Toggles the property mode to JS
  shouldDeleteProperty?: boolean; // Deletes the property, propertyValue is ignored
}

export interface WidgetMethods {
  getQueryGenerationConfig?: GetQueryGenerationConfig;
  getPropertyUpdatesForQueryBinding?: GetPropertyUpdatesForQueryBinding;
  getSnipingModeUpdates?: GetSnipingModeUpdates;
  getCanvasHeightOffset?: GetCanvasHeightOffset;
  getEditorCallouts?: GetEditorCallouts;
  getOneClickBindingConnectableWidgetConfig?: GetOneClickBindingConnectableWidgetConfig;
  IconCmp?: (props: SVGProps<SVGSVGElement>) => JSX.Element;
  ThumbnailCmp?: (props: SVGProps<SVGSVGElement>) => JSX.Element;
}

type GetEditorCallouts = (props: WidgetProps) => WidgetCallout[];

export interface WidgetCallout {
  message: string;
  links?: [
    {
      text: string;
      url: string;
    },
  ];
}

export type GetQueryGenerationConfig = (
  widgetProps: WidgetProps,
  formConfig?: WidgetQueryGenerationFormConfig,
) => WidgetQueryGenerationConfig;

export type GetPropertyUpdatesForQueryBinding = (
  queryConfig: WidgetQueryConfig,
  widget: WidgetProps,
  formConfig: WidgetQueryGenerationFormConfig,
) => Record<string, unknown>;

type SnipingModeSupportedKeys = "data" | "run" | "isDynamicPropertyPath";

interface OneClickBindingConnectableWidgetConfig {
  widgetBindPath: string;
  message: string;
}

export type GetOneClickBindingConnectableWidgetConfig = (
  widgetProps: WidgetProps,
) => OneClickBindingConnectableWidgetConfig;

export type GetSnipingModeUpdates = (
  propValueMap: Record<SnipingModeSupportedKeys, string | boolean>,
) => Array<PropertyUpdates>;

export type GetCanvasHeightOffset = (widgetProps: WidgetProps) => number;

export const GRID_DENSITY_MIGRATION_V1 = 4;

export const COMPACT_MODE_MIN_ROWS = 4;

export enum BlueprintOperationTypes {
  MODIFY_PROPS = "MODIFY_PROPS",
  ADD_ACTION = "ADD_ACTION",
  CHILD_OPERATIONS = "CHILD_OPERATIONS",
  BEFORE_DROP = "BEFORE_DROP",
  BEFORE_PASTE = "BEFORE_PASTE",
  BEFORE_ADD = "BEFORE_ADD",
  UPDATE_CREATE_PARAMS_BEFORE_ADD = "UPDATE_CREATE_PARAMS_BEFORE_ADD",
}

export enum BlueprintOperationActionTypes {
  CREATE_OR_UPDATE_DATASOURCE_WITH_ACTION = "CREATE_OR_UPDATE_DATASOURCE_WITH_ACTION",
}

export type FlattenedWidgetProps = WidgetProps & {
  children?: string[];
};

export interface DSLWidget extends WidgetProps {
  children?: DSLWidget[];
}

interface LayoutProps {
  positioning?: Positioning;
  useAutoLayout?: boolean;
  direction?: LayoutDirection;
  isFlexChild?: boolean;
  responsiveBehavior?: ResponsiveBehavior;
}

export type AutocompleteDefinitionFunction = (
  widgetProps: WidgetProps,
  extraDefsToDefine?: ExtraDef,
  configTree?: WidgetEntityConfig,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) => Record<string, any>;

export type AutocompletionDefinitions =
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Record<string, any> | AutocompleteDefinitionFunction;

const staticProps = omit(
  WIDGET_STATIC_PROPS,
  "children",
  "topRowBeforeCollapse",
  "bottomRowBeforeCollapse",
);

export type CanvasWidgetStructure = Pick<
  WidgetProps,
  keyof typeof staticProps
> &
  LayoutProps & {
    children?: CanvasWidgetStructure[];
    selected?: boolean;
    onClickCapture?: (event: React.MouseEvent<HTMLElement>) => void;
    isListWidgetCanvas?: boolean;
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

// Minimum width for Widget Popups
export const MinimumPopupWidthInPercentage = 18.75;

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

export const YOUTUBE_URL_REGEX =
  /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|\?v=)([^#&?]*).*/;

export const ICON_NAMES = Object.keys(IconNames).map(
  (name: string) => IconNames[name as keyof typeof IconNames],
);

export const dateFormatOptions = [
  {
    label: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
    subText: "ISO 8601",
    value: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  },
  {
    label: format(new Date(), "MMMM d, yyyy h:mm aa"),
    subText: "LLL",
    value: "MMMM d, yyyy h:mm aa",
  },
  {
    label: format(new Date(), "MMMM d, yyyy"),
    subText: "LL",
    value: "MMMM d, yyyy",
  },
  {
    label: format(new Date(), "yyyy-MM-dd HH:mm"),
    subText: "yyyy-MM-dd HH:mm",
    value: "yyyy-MM-dd HH:mm",
  },
  {
    label: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
    subText: "yyyy-MM-dd'T'HH:mm:ss",
    value: "yyyy-MM-dd'T'HH:mm:ss",
  },
  {
    label: format(new Date(), "yyyy-MM-dd hh:mm:ss aa"),
    subText: "yyyy-MM-dd hh:mm:ss aa",
    value: "yyyy-MM-dd hh:mm:ss aa",
  },
  {
    label: format(new Date(), "dd/MM/yyyy HH:mm"),
    subText: "dd/MM/yyyy HH:mm",
    value: "dd/MM/yyyy HH:mm",
  },
  {
    label: format(new Date(), "d MMMM, yyyy"),
    subText: "d MMMM, yyyy",
    value: "d MMMM, yyyy",
  },
  {
    label: format(new Date(), "h:mm aa d MMMM, yyyy"),
    subText: "h:mm aa d MMMM, yyyy",
    value: "h:mm aa d MMMM, yyyy",
  },
  {
    label: format(new Date(), "yyyy-MM-dd"),
    subText: "yyyy-MM-dd",
    value: "yyyy-MM-dd",
  },
  {
    label: format(new Date(), "MM-dd-yyyy"),
    subText: "MM-dd-yyyy",
    value: "MM-dd-yyyy",
  },
  {
    label: format(new Date(), "dd-MM-yyyy"),
    subText: "dd-MM-yyyy",
    value: "dd-MM-yyyy",
  },
  {
    label: format(new Date(), "MM/dd/yyyy"),
    subText: "MM/dd/yyyy",
    value: "MM/dd/yyyy",
  },
  {
    label: format(new Date(), "dd/MM/yyyy"),
    subText: "dd/MM/yyyy",
    value: "dd/MM/yyyy",
  },
  {
    label: format(new Date(), "dd/MM/yy"),
    subText: "dd/MM/yy",
    value: "dd/MM/yy",
  },
  {
    label: format(new Date(), "MM/dd/yy"),
    subText: "MM/dd/yy",
    value: "MM/dd/yy",
  },
];

export interface ThemeProp {
  theme: Theme;
}

export type SnipingModeProperty = Record<
  SnipingModeSupportedKeys,
  string | boolean
>;

export enum DefaultMobileCameraTypes {
  FRONT = "user",
  BACK = "environment",
}

export interface WidgetBlueprint {
  view?: Array<{
    type: string;
    size?: { rows: number; cols: number };
    position: { top?: number; left?: number };
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props: Record<string, any>;
  }>;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  operations?: any;
}

export interface WidgetConfigProps {
  rows: number;
  columns: number;
  blueprint?: WidgetBlueprint;
  widgetName: string;
  enhancements?: Record<string, unknown>; // TODO(abhinav): SPECIFY TYPES
}
