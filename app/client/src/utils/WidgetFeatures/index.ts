import {
  PropertyPaneConfig,
  PropertyPaneConfigTypes,
} from "constants/PropertyControlConstants";
import { RegisteredWidgetFeatures } from "utils/WidgetFeatures/WidgetFeaturesRegistry";
import { DynamicHeight } from "./autoHeight/contants";
import dynamicHeightPropertyPaneEnhancements from "./autoHeight/propertyPaneEnhancement";

export type WidgetFeatures = Record<
  RegisteredWidgetFeatures,
  { enabled: boolean; propertyPaneConfigType: PropertyPaneConfigTypes }
>;

/* This contains all properties which will be added 
   to a widget, automatically, by the Appsmith platform
   Each feature, is a unique key, whose value is an object
   with the list of properties to be added to a widget along
   with their default values

   Note: These are added to the widget configs during registration
*/
export const WidgetFeatureProps = {
  DYNAMIC_HEIGHT: {
    minDynamicHeight: 0,
    maxDynamicHeight: 0,
    dynamicHeight: DynamicHeight.FIXED,
  },
};

export const PropertyPaneConfigTemplates: Record<
  RegisteredWidgetFeatures,
  PropertyPaneConfig
> = {
  [RegisteredWidgetFeatures.dynamicHeight]: dynamicHeightPropertyPaneEnhancements,
};
