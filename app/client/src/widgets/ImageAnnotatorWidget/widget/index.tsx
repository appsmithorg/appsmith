import React from "react";
import { IAnnotation } from "react-image-annotation-ts";

import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { ValidationTypes } from "constants/WidgetValidation";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import {
  AnnotationSelector,
  AnnotationSelectorTypes,
  SelectionMode,
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
            propertyName: "imageAltText",
            helpText: "Sets image alt attribute",
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
                        name: "selection",
                        type: ValidationTypes.OBJECT,
                        params: {
                          required: false,
                          allowedKeys: [
                            {
                              name: "mode",
                              type: ValidationTypes.TEXT,
                              params: {
                                allowedValues: [
                                  SelectionMode.New,
                                  SelectionMode.Selecting,
                                  SelectionMode.Editing,
                                  SelectionMode.Final,
                                ],
                                default: SelectionMode.Editing,
                                required: true,
                              },
                            },
                            {
                              name: "showEditor",
                              type: ValidationTypes.BOOLEAN,
                              params: {
                                default: false,
                                required: true,
                              },
                            },
                            {
                              name: "anchorX",
                              type: ValidationTypes.NUMBER,
                            },
                            {
                              name: "anchorY",
                              type: ValidationTypes.NUMBER,
                            },
                          ],
                        },
                      },
                      {
                        name: "geometry",
                        type: ValidationTypes.OBJECT,
                        params: {
                          required: true,
                          allowedKeys: [
                            {
                              name: "type",
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
                          ],
                        },
                      },
                      {
                        name: "data",
                        type: ValidationTypes.OBJECT,
                        params: {
                          required: true,
                          allowedKeys: [
                            {
                              name: "text",
                              type: ValidationTypes.TEXT,
                              params: {
                                default: "",
                                required: true,
                              },
                            },
                            {
                              name: "id",
                              type: ValidationTypes.NUMBER,
                              params: {
                                default: 0,
                                unique: true,
                              },
                            },
                          ],
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
            helpText: "Controls the visibility of the widget",
            label: "Visible",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "isDisabled",
            helpText: "Sets to true to disable creating of annotations",
            label: "Disabled",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "selector",
            helpText: "Sets the selector of the widget",
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
    const {
      annotation,
      annotations,
      imageAltText,
      imageUrl,
      isDisabled,
      selector,
    } = this.props;

    return (
      <div onBlur={this.enableDrag} onFocus={this.disableDrag} tabIndex={1}>
        <ImageAnnotatorComponent
          annotation={annotation}
          annotations={annotations}
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
  annotations: IAnnotation[];
  imageAltText?: string;
  imageUrl: string;
  isDisabled?: boolean;
  isVisible: boolean;
  onAnnotationSubmit?: string;
  selector: AnnotationSelector;
}

export default ImageAnnotatorWidget;
