import React, { lazy, Suspense } from "react";
import BaseWidget, { WidgetProps, WidgetState } from "../../BaseWidget";
import { TextSize, WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import Skeleton from "components/utils/Skeleton";
import { retryPromise } from "utils/AppsmithUtils";
import { LabelPosition } from "components/constants";
import { Alignment } from "@blueprintjs/core";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";
import showdown from "showdown";

export enum RTEFormats {
  MARKDOWN = "markdown",
  HTML = "html",
}
const RichTextEditorComponent = lazy(() =>
  retryPromise(() =>
    import(/* webpackChunkName: "rte",webpackPrefetch: 2 */ "../component"),
  ),
);

const converter = new showdown.Converter();
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
            placeholderText: "<b>Hello World</b>",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "isRequired",
            label: "Required",
            helpText: "Makes input to the widget mandatory",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "isVisible",
            label: "Visible",
            helpText: "Controls the visibility of the widget",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "isDisabled",
            label: "Disable",
            helpText: "Disables input to this widget",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "animateLoading",
            label: "Animate Loading",
            controlType: "SWITCH",
            helpText: "Controls the loading of the widget",
            defaultValue: true,
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "isToolbarHidden",
            label: "Hide toolbar",
            helpText: "Controls the visibility of the toolbar",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
        ],
      },
      {
        sectionName: "Label",
        children: [
          {
            helpText: "Sets the label text of the widget",
            propertyName: "labelText",
            label: "Text",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter label text",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            helpText: "Sets the label position of the widget",
            propertyName: "labelPosition",
            label: "Position",
            controlType: "DROP_DOWN",
            options: [
              { label: "Left", value: LabelPosition.Left },
              { label: "Top", value: LabelPosition.Top },
              { label: "Auto", value: LabelPosition.Auto },
            ],
            isBindProperty: false,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            helpText: "Sets the label alignment of the widget",
            propertyName: "labelAlignment",
            label: "Alignment",
            controlType: "LABEL_ALIGNMENT_OPTIONS",
            options: [
              {
                icon: "LEFT_ALIGN",
                value: Alignment.LEFT,
              },
              {
                icon: "RIGHT_ALIGN",
                value: Alignment.RIGHT,
              },
            ],
            isBindProperty: false,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
            hidden: (props: RichTextEditorWidgetProps) =>
              props.labelPosition !== LabelPosition.Left,
            dependencies: ["labelPosition"],
          },
          {
            helpText:
              "Sets the label width of the widget as the number of columns",
            propertyName: "labelWidth",
            label: "Width (in columns)",
            controlType: "NUMERIC_INPUT",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            min: 0,
            validation: {
              type: ValidationTypes.NUMBER,
              params: {
                natural: true,
              },
            },
            hidden: (props: RichTextEditorWidgetProps) =>
              props.labelPosition !== LabelPosition.Left,
            dependencies: ["labelPosition"],
          },
        ],
      },
      {
        sectionName: "Label Styles",
        children: [
          {
            propertyName: "labelTextColor",
            label: "Text Color",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "labelTextSize",
            label: "Text Size",
            controlType: "DROP_DOWN",
            defaultValue: "0.875rem",
            options: [
              {
                label: "S",
                value: "0.875rem",
                subText: "0.875rem",
              },
              {
                label: "M",
                value: "1rem",
                subText: "1rem",
              },
              {
                label: "L",
                value: "1.25rem",
                subText: "1.25rem",
              },
              {
                label: "XL",
                value: "1.875rem",
                subText: "1.875rem",
              },
              {
                label: "XXL",
                value: "3rem",
                subText: "3rem",
              },
              {
                label: "3XL",
                value: "3.75rem",
                subText: "3.75rem",
              },
            ],
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "labelStyle",
            label: "Label Font Style",
            controlType: "BUTTON_TABS",
            options: [
              {
                icon: "BOLD_FONT",
                value: "BOLD",
              },
              {
                icon: "ITALICS_FONT",
                value: "ITALIC",
              },
            ],
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
        ],
      },
      {
        sectionName: "Events",
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
      {
        sectionName: "Styles",
        children: [
          {
            propertyName: "borderRadius",
            label: "Border Radius",
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
            label: "Box Shadow",
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

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      text: undefined,
      isDirty: false,
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
      isValid: `{{ this.isRequired ? this.text && this.text.length : true }}`,
    };
  }

  componentDidUpdate(prevProps: RichTextEditorWidgetProps): void {
    if (this.props.defaultText !== prevProps.defaultText) {
      if (this.props.isDirty) {
        this.props.updateWidgetMetaProperty("isDirty", false);
      }
    }
  }

  onValueChange = (text: string) => {
    if (!this.props.isDirty) {
      this.props.updateWidgetMetaProperty("isDirty", true);
    }

    this.props.updateWidgetMetaProperty("text", text, {
      triggerPropertyName: "onTextChange",
      dynamicString: this.props.onTextChange,
      event: {
        type: EventType.ON_TEXT_CHANGE,
      },
    });
  };

  getPageView() {
    let value = this.props.text ?? "";
    if (this.props.inputType === RTEFormats.MARKDOWN) {
      value = converter.makeHtml(value);
    }

    return (
      <Suspense fallback={<Skeleton />}>
        <RichTextEditorComponent
          borderRadius={this.props.borderRadius}
          boxShadow={this.props.boxShadow}
          compactMode={
            !(
              (this.props.bottomRow - this.props.topRow) /
                GRID_DENSITY_MIGRATION_V1 >
              1
            )
          }
          isDisabled={this.props.isDisabled}
          isMarkdown={this.props.inputType === RTEFormats.MARKDOWN}
          isToolbarHidden={!!this.props.isToolbarHidden}
          isValid={this.props.isValid}
          isVisible={this.props.isVisible}
          key={this.props.widgetId}
          labelAlignment={this.props.labelAlignment}
          labelPosition={this.props.labelPosition}
          labelStyle={this.props.labelStyle}
          labelText={this.props.labelText}
          labelTextColor={this.props.labelTextColor}
          labelTextSize={this.props.labelTextSize}
          labelWidth={this.getLabelWidth()}
          onValueChange={this.onValueChange}
          placeholder={this.props.placeholder}
          value={value}
          widgetId={this.props.widgetId}
        />
      </Suspense>
    );
  }

  static getWidgetType(): WidgetType {
    return "RICH_TEXT_EDITOR_WIDGET";
  }
}

export interface RichTextEditorWidgetProps extends WidgetProps {
  defaultText?: string;
  text: string;
  inputType: string;
  placeholder?: string;
  onTextChange?: string;
  isDisabled: boolean;
  isVisible?: boolean;
  isRequired?: boolean;
  isToolbarHidden?: boolean;
  borderRadius: string;
  boxShadow?: string;
  labelText: string;
  labelPosition?: LabelPosition;
  labelAlignment?: Alignment;
  labelWidth?: number;
  labelTextColor?: string;
  labelTextSize?: TextSize;
  labelStyle?: string;
  isDirty: boolean;
}

export default RichTextEditorWidget;
