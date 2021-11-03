import React from "react";
import { IAnnotation } from "react-image-annotation-ts";

import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import ImageAnnotatorComponent from "../component";
import { ValidationTypes } from "constants/WidgetValidation";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

class ImageAnnotatorWidget extends BaseWidget<
  ImageAnnotatorWidgetProps,
  WidgetState
> {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            helpText: "Url of the image to be annotated",
            propertyName: "imageUrl",
            label: "Image URL",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter URL / Base64",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.IMAGE_URL },
          },
          {
            propertyName: "isDisabled",
            helpText: "Disables input to the widget",
            label: "Disabled",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "isVisible",
            helpText: "Controls the visibility of the widget",
            label: "Visible",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
        ],
      },
      {
        sectionName: "Actions",
        children: [
          {
            helpText: "Triggers an action when an annotation is changed",
            propertyName: "onAnnotationChange",
            label: "onAnnotationChange",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
          {
            helpText: "Triggers an action when an annotation is submitted",
            propertyName: "onAnnotationSubmit",
            label: "onAnnotationSubmit",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
        ],
      },
    ];
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      annotation: {},
      annotations: [],
    };
  }

  handleAnnotationChange = (annotation: IAnnotation) => {
    this.props.updateWidgetMetaProperty("annotation", annotation, {
      triggerPropertyName: "onAnnotationChange",
      dynamicString: this.props.onAnnotationChange,
      event: {
        type: EventType.ON_IMAGE_ANNOTATOR_ANNOTATION_CHANGE,
      },
    });
  };

  handleAnnotationSubmit = (annotation: IAnnotation) => {
    const { data, geometry } = annotation;
    const newAnnotations = this.props.annotations.concat({
      geometry,
      data: {
        ...data,
        id: Math.random(),
      },
    });

    this.props.updateWidgetMetaProperty("annotations", newAnnotations, {
      triggerPropertyName: "onAnnotationSubmit",
      dynamicString: this.props.onAnnotationSubmit,
      event: {
        type: EventType.ON_IMAGE_ANNOTATOR_ANNOTATION_SUBMIT,
      },
    });
  };

  handleResetAnnotations = () => {
    this.props.updateWidgetMetaProperty("annotation", {});
    this.props.updateWidgetMetaProperty("annotations", []);
  };

  disableDrag = () => {
    this.props.updateWidgetMetaProperty("dragDisabled", true);
  };
  enableDrag = () => {
    this.props.updateWidgetMetaProperty("dragDisabled", false);
  };

  getPageView() {
    const { annotation, annotations, imageUrl, isDisabled } = this.props;

    return (
      <div onBlur={this.enableDrag} onFocus={this.disableDrag} tabIndex={1}>
        <ImageAnnotatorComponent
          annotation={annotation}
          annotations={annotations}
          disabled={isDisabled}
          imageUrl={imageUrl}
          onChange={this.handleAnnotationChange}
          onReset={this.handleResetAnnotations}
          onSubmit={this.handleAnnotationSubmit}
        />
      </div>
    );
  }

  static getWidgetType(): string {
    return "IMAGE_ANNOTATOR_WIDGET";
  }
}

export interface ImageAnnotatorWidgetProps extends WidgetProps {
  annotation: IAnnotation;
  annotations: IAnnotation[];
  imageUrl: string;
  isDisabled: boolean;
  isVisible: boolean;
  onAnnotationChange?: string;
  onAnnotationSubmit?: string;
}

export default ImageAnnotatorWidget;
