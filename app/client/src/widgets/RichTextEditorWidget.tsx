import React, { lazy, Suspense } from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/ActionConstants";
import { WidgetPropertyValidationType } from "utils/ValidationFactory";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import {
  TriggerPropertiesMap,
  DerivedPropertiesMap,
} from "utils/WidgetFactory";
import Skeleton from "components/utils/Skeleton";

const RichtextEditorComponent = lazy(() =>
  import(
    /* webpackChunkName: "rte",webpackPrefetch: 2 */ "components/designSystems/appsmith/RichTextEditorComponent"
  ),
);

class RichTextEditorWidget extends BaseWidget<
  RichTextEditorWidgetProps,
  WidgetState
> {
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      text: VALIDATION_TYPES.TEXT,
      placeholder: VALIDATION_TYPES.TEXT,
      defaultValue: VALIDATION_TYPES.TEXT,
      isDisabled: VALIDATION_TYPES.BOOLEAN,
      isVisible: VALIDATION_TYPES.BOOLEAN,
      // onTextChange: VALIDATION_TYPES.ACTION_SELECTOR,
    };
  }

  static getTriggerPropertyMap(): TriggerPropertiesMap {
    return {
      onTextChange: true,
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      text: undefined,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      text: "defaultText",
    };
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      value: `{{this.text}}`,
    };
  }

  onValueChange = (text: string) => {
    this.updateWidgetMetaProperty("text", text);
    if (this.props.onTextChange) {
      super.executeAction({
        dynamicString: this.props.onTextChange,
        event: {
          type: EventType.ON_TEXT_CHANGE,
        },
      });
    }
  };

  getPageView() {
    return (
      <Suspense fallback={<Skeleton />}>
        <RichtextEditorComponent
          onValueChange={this.onValueChange}
          defaultValue={this.props.text}
          widgetId={this.props.widgetId}
          placeholder={this.props.placeholder}
          key={this.props.widgetId}
          isDisabled={this.props.isDisabled}
          isVisible={this.props.isVisible}
        />
      </Suspense>
    );
  }

  getWidgetType(): WidgetType {
    return "RICH_TEXT_EDITOR_WIDGET";
  }
}

export interface InputValidator {
  validationRegex: string;
  errorMessage: string;
}

export interface RichTextEditorWidgetProps extends WidgetProps {
  defaultText?: string;
  text?: string;
  placeholder?: string;
  onTextChange?: string;
  isDisabled?: boolean;
  isVisible?: boolean;
}

export default RichTextEditorWidget;
