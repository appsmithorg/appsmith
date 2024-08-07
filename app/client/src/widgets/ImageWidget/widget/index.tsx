import { RenderModes } from "constants/WidgetConstants";
import * as React from "react";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import ImageComponent from "../component";

import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import type { SetterConfig, Stylesheet } from "entities/AppTheming";
import type { DerivedPropertiesMap } from "WidgetProvider/factory";
import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";
import type {
  AnvilConfig,
  AutocompletionDefinitions,
} from "WidgetProvider/constants";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import IconSVG from "../icon.svg";
import ThumbnailSVG from "../thumbnail.svg";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { WIDGET_TAGS } from "constants/WidgetConstants";
import { FlexVerticalAlignment } from "layoutSystems/common/utils/constants";

class ImageWidget extends BaseWidget<ImageWidgetProps, WidgetState> {
  constructor(props: ImageWidgetProps) {
    super(props);
    this.onImageClick = this.onImageClick.bind(this);
  }

  static type = "IMAGE_WIDGET";

  static getConfig() {
    return {
      name: "Image",
      iconSVG: IconSVG,
      thumbnailSVG: ThumbnailSVG,
      tags: [WIDGET_TAGS.MEDIA],
    };
  }

  static getDefaults() {
    return {
      defaultImage: getAssetUrl(`${ASSETS_CDN_URL}/widgets/default.png`),
      imageShape: "RECTANGLE",
      maxZoomLevel: 1,
      enableRotation: false,
      enableDownload: false,
      objectFit: "cover",
      image: "",
      rows: 12,
      columns: 12,
      widgetName: "Image",
      version: 1,
      animateLoading: true,
      flexVerticalAlignment: FlexVerticalAlignment.Top,
    };
  }

  static getAutoLayoutConfig() {
    return {
      widgetSize: [
        {
          viewportMinWidth: 0,
          configuration: () => {
            return {
              minWidth: "280px",
              minHeight: "40px",
            };
          },
        },
      ],
    };
  }

  static getAnvilConfig(): AnvilConfig | null {
    return {
      isLargeWidget: false,
      widgetSize: {
        maxHeight: {},
        maxWidth: {},
        minHeight: { base: "40px" },
        minWidth: { base: "280px" },
      },
    };
  }

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return {
      "!doc":
        "Image widget is used to display images in your app. Images must be either a URL or a valid base64.",
      "!url": "https://docs.appsmith.com/widget-reference/image",
      image: "string",
      isVisible: DefaultAutocompleteDefinitions.isVisible,
    };
  }

  static getSetterConfig(): SetterConfig {
    return {
      __setters: {
        setVisibility: {
          path: "isVisible",
          type: "boolean",
        },
        setImage: {
          path: "image",
          type: "string",
        },
      },
    };
  }

  static getPropertyPaneContentConfig() {
    return [
      {
        sectionName: "Data",
        children: [
          {
            helpText: "Sets the image to be displayed",
            propertyName: "image",
            label: "Image",
            controlType: "INPUT_TEXT",
            placeholderText: "URL / Base64",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.IMAGE_URL },
          },
          {
            helpText: "Sets the default image to be displayed when load fails",
            propertyName: "defaultImage",
            label: "Default image",
            controlType: "INPUT_TEXT",
            placeholderText: "URL / Base64",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.IMAGE_URL },
          },
        ],
      },
      {
        sectionName: "General",
        children: [
          {
            helpText:
              "Sets how the Image should be resized to fit its container.",
            propertyName: "objectFit",
            label: "Object fit",
            controlType: "DROP_DOWN",
            defaultValue: "contain",
            options: [
              {
                label: "Contain",
                value: "contain",
              },
              {
                label: "Cover",
                value: "cover",
              },
              {
                label: "Auto",
                value: "auto",
              },
            ],
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                allowedValues: ["contain", "cover", "auto"],
              },
            },
          },
          {
            helpText: "Controls the max zoom of the widget",
            propertyName: "maxZoomLevel",
            label: "Max zoom level",
            controlType: "DROP_DOWN",
            options: [
              {
                label: "1x (No Zoom)",
                value: 1,
              },
              {
                label: "2x",
                value: 2,
              },
              {
                label: "4x",
                value: 4,
              },
              {
                label: "8x",
                value: 8,
              },
              {
                label: "16x",
                value: 16,
              },
            ],
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.NUMBER,
              params: { allowedValues: [1, 2, 4, 8, 16] },
            },
          },
          {
            helpText: "Controls the visibility of the widget",
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "animateLoading",
            label: "Animate loading",
            controlType: "SWITCH",
            helpText: "Controls the loading of the widget",
            defaultValue: true,
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            helpText: "Controls if the image is allowed to rotate",
            propertyName: "enableRotation",
            label: "Enable rotation",
            controlType: "SWITCH",
            isJSConvertible: false,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            helpText: "Controls if the image is allowed to download",
            propertyName: "enableDownload",
            label: "Enable download",
            controlType: "SWITCH",
            isJSConvertible: false,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
        ],
      },
      {
        sectionName: "Events",
        children: [
          {
            helpText: "when user clicks on an image",
            propertyName: "onClick",
            label: "onClick",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
        ],
      },
    ];
  }

  static getPropertyPaneStyleConfig() {
    return [
      {
        sectionName: "Border and shadow",
        children: [
          {
            propertyName: "borderRadius",
            label: "Border radius",
            helpText:
              "Rounds the corners of the icon button's outer border edge",
            controlType: "BORDER_RADIUS_OPTIONS",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "boxShadow",
            label: "Box shadow",
            helpText:
              "Enables you to cast a drop shadow from the frame of the widget",
            controlType: "BOX_SHADOW_OPTIONS",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
        ],
      },
    ];
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {};
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {};
  }
  // TODO Find a way to enforce this, (dont let it be set)
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getMetaPropertiesMap(): Record<string, any> {
    return {};
  }

  static getStylesheetConfig(): Stylesheet {
    return {
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      boxShadow: "none",
    };
  }

  getWidgetView() {
    const { maxZoomLevel, objectFit } = this.props;
    return (
      <ImageComponent
        borderRadius={this.props.borderRadius}
        boxShadow={this.props.boxShadow}
        defaultImageUrl={this.props.defaultImage}
        disableDrag={(disable: boolean) => {
          this.disableDrag(disable);
        }}
        enableDownload={this.props.enableDownload}
        enableRotation={this.props.enableRotation}
        imageUrl={this.props.image}
        isLoading={this.props.isLoading}
        maxZoomLevel={maxZoomLevel}
        objectFit={objectFit}
        onClick={this.props.onClick ? this.onImageClick : undefined}
        showHoverPointer={this.props.renderMode === RenderModes.PAGE}
        widgetId={this.props.widgetId}
      />
    );
  }

  onImageClick() {
    if (this.props.onClick) {
      super.executeAction({
        triggerPropertyName: "onClick",
        dynamicString: this.props.onClick,
        event: {
          type: EventType.ON_CLICK,
        },
      });
    }
  }
}

export type ImageShape = "RECTANGLE" | "CIRCLE" | "ROUNDED";

export interface ImageWidgetProps extends WidgetProps {
  image: string;
  imageShape: ImageShape;
  defaultImage: string;
  maxZoomLevel: number;
  imageRotation?: number;
  enableDownload?: boolean;
  enableRotation?: boolean;
  objectFit: string;
  onClick?: string;
  borderRadius: string;
  boxShadow?: string;
}

export default ImageWidget;
