import React, { lazy, Suspense } from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/ActionConstants";
import { WidgetPropertyValidationType } from "utils/WidgetValidation";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import {
  TriggerPropertiesMap,
  DerivedPropertiesMap,
} from "utils/WidgetFactory";
import Skeleton from "components/utils/Skeleton";
import * as Sentry from "@sentry/react";
import { retryPromise } from "utils/AppsmithUtils";
import withMeta, { WithMeta } from "./MetaHOC";

const RichTextEditorComponent = lazy(() =>
  retryPromise(() =>
    import(
      /* webpackChunkName: "rte",webpackPrefetch: 2 */ "components/designSystems/appsmith/RichTextEditorComponent"
    ),
  ),
);

class RichTextEditorWidget extends BaseWidget<
  RichTextEditorWidgetProps,
  WidgetState
> {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "defaultText",
            helpText:
              "Sets the default text of the widget. The text is updated if the default text changes",
            label: "Default text",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter HTML",
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "isVisible",
            label: "Visible",
            helpText: "Controls the visibility of the widget",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "isDisabled",
            label: "Disable",
            helpText: "Disables input to this widget",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
          },
        ],
      },
      {
        sectionName: "Actions",
        children: [
          {
            helpText: "Triggers an action when the text is changed",
            propertyName: "onTextChange",
            label: "onTextChange",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
        ],
      },
    ];
  }
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
    this.props.updateWidgetMetaProperty("text", text, {
      dynamicString: this.props.onTextChange,
      event: {
        type: EventType.ON_TEXT_CHANGE,
      },
    });
  };

  getPageView() {
    return (
      <Suspense fallback={<Skeleton />}>
        <RichTextEditorComponent
          onValueChange={this.onValueChange}
          defaultValue={this.props.text || ""}
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

export interface RichTextEditorWidgetProps extends WidgetProps, WithMeta {
  defaultText?: string;
  text?: string;
  placeholder?: string;
  onTextChange?: string;
  isDisabled?: boolean;
  isVisible?: boolean;
}

export default RichTextEditorWidget;
export const ProfiledRichTextEditorWidget = Sentry.withProfiler(
  withMeta(RichTextEditorWidget),
);
