import type { WidgetProps } from "widgets/types";
import type { Responsive, SizingDimension } from "@design-system/widgets";
import type { PropertyPaneConfig } from "constants/PropertyControlConstants";
import type { WidgetTags } from "constants/WidgetConstants";
import type { Stylesheet } from "entities/AppTheming";
import type { DerivedPropertiesMap } from "WidgetProvider/factory";
import type { WidgetFeatures } from "widgets/types";
import type {
  WidgetQueryConfig,
  WidgetQueryGenerationConfig,
  WidgetQueryGenerationFormConfig,
} from "WidgetQueryGenerators/types";
import { WIDGET_STATIC_PROPS } from "constants/WidgetConstants";
import { omit } from "lodash";
import type { ExtraDef } from "utils/autocomplete/defCreatorUtils";
import type { WidgetEntityConfig } from "@appsmith/entities/DataTree/types";
import type {
  LayoutDirection,
  Positioning,
  ResponsiveBehavior,
} from "layoutSystems/common/utils/constants";

export interface DSLWidget extends WidgetProps {
  children?: DSLWidget[];
}

export interface WidgetSizeConfig {
  viewportMinWidth: number;
  configuration: (props: any) => Record<string, string | number>;
}

interface ResizableValues {
  vertical?: boolean;
  horizontal?: boolean;
}
type ResizableOptions = ResizableValues | ((props: any) => ResizableValues);
export interface AutoDimensionValues {
  width?: boolean;
  height?: boolean;
}
export type AutoDimensionOptions =
  | AutoDimensionValues
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
}

export interface AnvilConfig {
  isLargeWidget: boolean;
  // min/max sizes for the widget
  widgetSize?:
    | SizeConfig
    | ((props: any, isPreviewMode: boolean) => SizeConfig);
}

export interface WidgetBaseConfiguration {
  name: string;
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
    meta: Record<string, any>;
    derived: DerivedPropertiesMap;
    loadingProperties?: Array<RegExp>;
    stylesheetConfig?: Stylesheet;
    autocompleteDefinitions?: AutocompletionDefinitions;
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
}

type GetEditorCallouts = (props: WidgetProps) => WidgetCallout[];

export interface WidgetCallout {
  message: string;
  links: [
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
    props: Record<string, any>;
  }>;
  operations?: any;
}

export interface WidgetConfigProps {
  rows: number;
  columns: number;
  blueprint?: WidgetBlueprint;
  widgetName: string;
  enhancements?: Record<string, unknown>; // TODO(abhinav): SPECIFY TYPES
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
) => Record<string, any>;

export type AutocompletionDefinitions =
  | Record<string, any>
  | AutocompleteDefinitionFunction;

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

const staticProps = omit(
  WIDGET_STATIC_PROPS,
  "children",
  "topRowBeforeCollapse",
  "bottomRowBeforeCollapse",
);

export type AlignWidget = "LEFT" | "RIGHT";
