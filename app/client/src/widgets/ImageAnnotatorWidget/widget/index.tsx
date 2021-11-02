import React from "react";
import { IAnnotation } from "react-image-annotation-ts";

import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import ImageAnnotatorComponent from "../component";
import { ValidationTypes } from "constants/WidgetValidation";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { WIDGET_PADDING } from "constants/WidgetConstants";

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

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      annotation: {},
      annotations: [],
    };
  }

  handleAnnotationSubmit = (annotation: IAnnotation) => {
    const newAnnotations = this.props.annotations.concat(annotation);

    this.props.updateWidgetMetaProperty("annotations", newAnnotations, {
      triggerPropertyName: "onAnnotationSubmit",
      dynamicString: this.props.onAnnotationSubmit,
      event: {
        type: EventType.ON_IMAGE_ANNOTATOR_ANNOTATION_SUBMIT,
      },
    });
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
      bottomRow,
      imageUrl,
      leftColumn,
      parentColumnSpace,
      parentRowSpace,
      rightColumn,
      topRow,
    } = this.props;

    const height = (bottomRow - topRow) * parentRowSpace - WIDGET_PADDING;
    const width =
      (rightColumn - leftColumn) * parentColumnSpace - WIDGET_PADDING;

    return (
      <div onFocus={this.disableDrag} tabIndex={1}>
        <ImageAnnotatorComponent
          annotation={annotation}
          annotations={annotations}
          imageUrl={imageUrl}
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
  onAnnotationSaved?: string;
}

export default ImageAnnotatorWidget;
