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
import moment from "moment";
import type { DerivedPropertiesMap } from "WidgetProvider/factory";
import type { WidgetFeatures } from "utils/WidgetFeatures";
import type { WidgetProps } from "../widgets/BaseWidget";
import type { ExtraDef } from "utils/autocomplete/defCreatorUtils";
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
  IconCmp?: () => JSX.Element;
  ThumbnailCmp?: () => JSX.Element;
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
