import React from "react";
import { IAnnotation } from "react-image-annotation-ts";

import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { ValidationTypes } from "constants/WidgetValidation";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import {
  AnnotationObject,
  AnnotationSelector,
  AnnotationSelectorTypes,
} from "../constants";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";

import ImageAnnotatorComponent from "../component";

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
            helpText: "To add an image to the canvas, enter its URL here.",
            propertyName: "imageUrl",
            label: "Image URL",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter URL / Base64",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.IMAGE_URL },
          },
          {
            propertyName: "imageAltText",
            helpText:
              "Enter the alternative text for the image here, giving a short description of it.",
            label: "Image Alt Text",
            controlType: "INPUT_TEXT",
            placeholderText: "A text description of the image",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                default: "",
              },
            },
          },
          {
            propertyName: "defaultAnnotations",
            helpText: "Array of annotations",
            label: "Default Annotations",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.ARRAY,
              params: {
                children: {
                  type: ValidationTypes.OBJECT,
                  params: {
                    allowedKeys: [
                      {
                        name: "shape",
                        type: ValidationTypes.TEXT,
                        params: {
                          allowedValues: [
                            AnnotationSelectorTypes.RECTANGLE,
                            AnnotationSelectorTypes.POINT,
                            AnnotationSelectorTypes.OVAL,
                          ],
                          default: AnnotationSelectorTypes.RECTANGLE,
                          required: true,
                        },
                      },
                      {
                        name: "x",
                        type: ValidationTypes.NUMBER,
                        params: {
                          default: 0,
                          required: true,
                        },
                      },
                      {
                        name: "y",
                        type: ValidationTypes.NUMBER,
                        params: {
                          default: 0,
                          required: true,
                        },
                      },
                      {
                        name: "height",
                        type: ValidationTypes.NUMBER,
                        params: {
                          default: 0,
                          required: true,
                        },
                      },
                      {
                        name: "width",
                        type: ValidationTypes.NUMBER,
                        params: {
                          default: 0,
                          required: true,
                        },
                      },
                      {
                        name: "text",
                        type: ValidationTypes.TEXT,
                        params: {
                          default: "",
                          required: true,
                        },
                      },
                    ],
                  },
                },
              },
            },
            evaluationSubstitutionType:
              EvaluationSubstitutionType.SMART_SUBSTITUTE,
          },
          {
            propertyName: "isVisible",
            helpText:
              "Controls widget's visibility on the page. When turned off, the widget will not be visible when the app is published.",
            label: "Visible",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "isDisabled",
            helpText:
              "It enables or disables the annotation. If turned on, the user cannot annotate the image.",
            label: "Disabled",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "selector",
            helpText:
              "It allows you to choose the type of selector for the annotation.",
            label: "Selector",
            controlType: "DROP_DOWN",
            options: [
              {
                label: "Rectangle",
                value: AnnotationSelectorTypes.RECTANGLE,
              },
              {
                label: "Point",
                value: AnnotationSelectorTypes.POINT,
              },
              {
                label: "Oval",
                value: AnnotationSelectorTypes.OVAL,
              },
            ],
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                allowedValues: [
                  AnnotationSelectorTypes.RECTANGLE,
                  AnnotationSelectorTypes.POINT,
                  AnnotationSelectorTypes.OVAL,
                ],
                default: AnnotationSelectorTypes.RECTANGLE,
              },
            },
          },
        ],
      },
      {
        sectionName: "Actions",
        children: [
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

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      annotations: "defaultAnnotations",
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      annotation: {},
      annotations: undefined,
    };
  }

  handleAnnotationChange = (annotation: IAnnotation) => {
    this.props.updateWidgetMetaProperty("annotation", annotation);
  };

  handleAnnotationSubmit = (annotation: IAnnotation) => {
    const {
      data: { text },
      geometry: { height, type, width, x, y },
    } = annotation;
    const newAnnotations = this.props.annotations.concat({
      shape: type,
      x,
      y,
      width,
      height,
      text,
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
    const {
      annotation,
      annotations,
      imageAltText,
      imageUrl,
      isDisabled,
      selector,
    } = this.props;

    const transformedAnnotations: IAnnotation[] = annotations.map(
      (annotation: AnnotationObject) => {
        const { height, shape, text, width, x, y } = annotation;
        return {
          geometry: {
            type: shape,
            x,
            y,
            width,
            height,
          },
          data: {
            text,
            id: Math.random(),
          },
        };
      },
    );

    return (
      <div onBlur={this.enableDrag} onFocus={this.disableDrag} tabIndex={1}>
        <ImageAnnotatorComponent
          annotation={annotation}
          annotations={transformedAnnotations}
          disabled={isDisabled}
          imageAltText={imageAltText}
          imageUrl={imageUrl}
          onChange={this.handleAnnotationChange}
          onReset={this.handleResetAnnotations}
          onSubmit={this.handleAnnotationSubmit}
          selector={selector}
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
  annotations: AnnotationObject[];
  imageAltText?: string;
  imageUrl: string;
  isDisabled?: boolean;
  isVisible: boolean;
  onAnnotationSubmit?: string;
  selector: AnnotationSelector;
}

export default ImageAnnotatorWidget;
