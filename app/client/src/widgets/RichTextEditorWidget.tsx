import React, { lazy, Suspense } from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import Skeleton from "components/utils/Skeleton";
import * as Sentry from "@sentry/react";
import { retryPromise } from "utils/AppsmithUtils";
import withMeta, { WithMeta } from "./MetaHOC";
const showdown = require("showdown");

export enum RTEFormats {
  MARKDOWN = "markdown",
  HTML = "html",
}
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
            propertyName: "inputType",
            helpText:
              "Sets the input type of the default text property in widget.",
            label: "Input Type",
            controlType: "DROP_DOWN",
            options: [
              {
                label: "Markdown",
                value: "markdown",
              },
              {
                label: "HTML",
                value: "html",
              },
            ],
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "defaultText",
            helpText:
              "Sets the default text of the widget. The text is updated if the default text changes",
            label: "Default text",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter HTML",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.TEXT,
          },
          {
            propertyName: "isVisible",
            label: "Visible",
            helpText: "Controls the visibility of the widget",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.BOOLEAN,
          },
          {
            propertyName: "isDisabled",
            label: "Disable",
            helpText: "Disables input to this widget",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.BOOLEAN,
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
      triggerPropertyName: "onTextChange",
      dynamicString: this.props.onTextChange,
      event: {
        type: EventType.ON_TEXT_CHANGE,
      },
    });
  };

  getPageView() {
    let defaultValue = this.props.text || "";
    if (this.props.inputType === RTEFormats.MARKDOWN) {
      const converter = new showdown.Converter();
      defaultValue = converter.makeHtml(defaultValue);
    }
    return (
      <Suspense fallback={<Skeleton />}>
        <RichTextEditorComponent
          defaultValue={defaultValue}
          isDisabled={this.props.isDisabled}
          isVisible={this.props.isVisible}
          key={this.props.widgetId}
          onValueChange={this.onValueChange}
          placeholder={this.props.placeholder}
          widgetId={this.props.widgetId}
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
  text: string;
  inputType: string;
  placeholder?: string;
  onTextChange?: string;
  isDisabled?: boolean;
  isVisible?: boolean;
}

export default RichTextEditorWidget;
export const ProfiledRichTextEditorWidget = Sentry.withProfiler(
  withMeta(RichTextEditorWidget),
);
