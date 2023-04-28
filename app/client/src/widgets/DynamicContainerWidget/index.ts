import Widget from "./widget";
import IconSVG from "./icon.svg";
import { DYNAMIC_CONTAINER_CLASS, DynamicContainerLayouts } from "./constants";
import { Positioning, ResponsiveBehavior } from "utils/autoLayout/constants";
import { RegisteredWidgetFeatures } from "utils/WidgetFeatures";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Dynamic Container", // The display name which will be made in uppercase and show in the widgets panel ( can have spaces )
  iconSVG: IconSVG,
  needsMeta: false, // Defines if this widget adds any meta properties
  isCanvas: true, // Defines if this widget has a canvas within in which we can drop other widgets
  // features: {
  //   dynamicHeight: {
  //     sectionIndex: 0, // Index of the property pane "General" section
  //     active: false,
  //   },
  // },
  defaults: {
    widgetName: "DynamicContainer",
    previewLayoutInCanvas: true,
    rows: 50,
    columns: 50,
    version: 1,
    layout: DynamicContainerLayouts["50_50"],
    children: [],
    positioning: Positioning.Fixed,
    responsiveBehavior: ResponsiveBehavior.Fill,
    blueprint: {
      view: [
        {
          type: "CANVAS_WIDGET",
          position: { top: 0, left: 0 },
          props: {
            canExtend: false,
            detachFromLayout: true,
            customClassName: DYNAMIC_CONTAINER_CLASS,
            dropDisabled: true,
            openParentPropertyPane: true,
            noPad: true,
            children: [],
            blueprint: {
              view: [
                {
                  type: "CONTAINER_WIDGET",
                  size: {
                    rows: 12,
                    cols: 64,
                  },
                  position: { top: 0, left: 0 },
                  props: {
                    backgroundColor: "white",
                    containerStyle: "card",
                    dragDisabled: true,
                    isDeletable: false,
                    disallowCopy: true,
                    noContainerOffset: true,
                    positioning: Positioning.Fixed,
                    disabledWidgetFeatures: [
                      RegisteredWidgetFeatures.DYNAMIC_HEIGHT,
                    ],
                    shouldScrollContents: false,
                    dynamicHeight: "FIXED",
                    children: [],
                    blueprint: {
                      view: [
                        {
                          type: "CANVAS_WIDGET",
                          position: { top: 0, left: 0 },
                          props: {
                            // customClassName: "enrique-3",
                            // containerStyle: "none",
                            canExtend: false,
                            detachFromLayout: true,
                            children: [],
                            version: 1,
                            useAutoLayout: false,
                            blueprint: {
                              view: [
                                {
                                  type: "TEXT_WIDGET",
                                  size: {
                                    rows: 4,
                                    cols: 36,
                                  },
                                  position: {
                                    top: 4,
                                    left: 1,
                                  },
                                  props: {
                                    text: "Panel A",
                                    fontSize: "1.25rem",
                                    fontStyle: "BOLD",
                                    version: 1,
                                  },
                                },
                              ],
                            },
                          },
                        },
                      ],
                    },
                  },
                },
                {
                  type: "CONTAINER_WIDGET",
                  size: {
                    rows: 12,
                    cols: 64,
                  },
                  position: { top: 12, left: 0 },
                  props: {
                    backgroundColor: "white",
                    containerStyle: "card",
                    dragDisabled: true,
                    isDeletable: false,
                    disallowCopy: true,
                    noContainerOffset: true,
                    positioning: Positioning.Fixed,
                    disabledWidgetFeatures: [
                      RegisteredWidgetFeatures.DYNAMIC_HEIGHT,
                    ],
                    shouldScrollContents: false,
                    dynamicHeight: "FIXED",
                    children: [],
                    blueprint: {
                      view: [
                        {
                          type: "CANVAS_WIDGET",
                          position: { top: 0, left: 0 },
                          props: {
                            canExtend: false,
                            detachFromLayout: true,
                            children: [],
                            version: 1,
                            useAutoLayout: false,
                            blueprint: {
                              view: [
                                {
                                  type: "TEXT_WIDGET",
                                  size: {
                                    rows: 4,
                                    cols: 36,
                                  },
                                  position: {
                                    top: 4,
                                    left: 1,
                                  },
                                  props: {
                                    text: "Panel B",
                                    fontSize: "1.25rem",
                                    fontStyle: "BOLD",
                                    version: 1,
                                  },
                                },
                              ],
                            },
                          },
                        },
                      ],
                    },
                  },
                },
                {
                  type: "CONTAINER_WIDGET",
                  size: {
                    rows: 12,
                    cols: 64,
                  },
                  position: { top: 24, left: 0 },
                  props: {
                    backgroundColor: "white",
                    containerStyle: "card",
                    dragDisabled: true,
                    isDeletable: false,
                    disallowCopy: true,
                    noContainerOffset: true,
                    positioning: Positioning.Fixed,
                    disabledWidgetFeatures: [
                      RegisteredWidgetFeatures.DYNAMIC_HEIGHT,
                    ],
                    shouldScrollContents: false,
                    dynamicHeight: "FIXED",
                    children: [],
                    blueprint: {
                      view: [
                        {
                          type: "CANVAS_WIDGET",
                          position: { top: 0, left: 0 },
                          props: {
                            canExtend: false,
                            detachFromLayout: true,
                            children: [],
                            version: 1,
                            useAutoLayout: false,
                            blueprint: {
                              view: [
                                {
                                  type: "TEXT_WIDGET",
                                  size: {
                                    rows: 4,
                                    cols: 36,
                                  },
                                  position: {
                                    top: 4,
                                    left: 1,
                                  },
                                  props: {
                                    text: "Panel C",
                                    fontSize: "1.25rem",
                                    fontStyle: "BOLD",
                                    version: 1,
                                  },
                                },
                              ],
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    },
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    // config: Widget.getPropertyPaneConfig(),
    contentConfig: Widget.getPropertyPaneContentConfig(),
    styleConfig: Widget.getPropertyPaneStyleConfig(),
    autocompleteDefinitions: Widget.getAutocompleteDefinitions(),
  },
};

export default Widget;
