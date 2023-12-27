import React from "react";

import type { DerivedPropertiesMap } from "WidgetProvider/factory";

import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";

import CustomComponent from "../component";

import IconSVG from "../icon.svg";
import { RenderModes, WIDGET_TAGS } from "constants/WidgetConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import type { AppThemeProperties, SetterConfig } from "entities/AppTheming";
import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";
import type { AutocompletionDefinitions } from "WidgetProvider/constants";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { DEFAULT_MODEL } from "../constants";
import defaultApp from "./defaultApp";
import type { ExtraDef } from "utils/autocomplete/defCreatorUtils";
import { generateTypeDef } from "utils/autocomplete/defCreatorUtils";
import { CUSTOM_WIDGET_DOC_URL } from "pages/Editor/CustomWidgetBuilder/contants";
import { Link } from "design-system";
import styled from "styled-components";

const StyledLink = styled(Link)`
  display: inline-block;
  span {
    font-size: 12px;
  }
`;

class CustomWidget extends BaseWidget<CustomWidgetProps, WidgetState> {
  static type = "CUSTOM_WIDGET";

  static getConfig() {
    return {
      name: "Custom",
      hideCard: !super.getFeatureFlag(
        FEATURE_FLAG.release_custom_widgets_enabled,
      ),
      iconSVG: IconSVG,
      needsMeta: true,
      isCanvas: false,
      tags: [WIDGET_TAGS.DISPLAY],
      searchTags: ["external"],
      isSearchWildcard: true,
    };
  }

  static getDefaults() {
    return {
      widgetName: "Custom",
      rows: 30,
      columns: 20,
      version: 1,
      onResetClick: "{{showAlert('Successfully reset!!', '');}}",
      events: ["onResetClick"],
      isVisible: true,
      defaultModel: DEFAULT_MODEL,
      srcDoc: defaultApp.srcDoc,
      uncompiledSrcDoc: defaultApp.uncompiledSrcDoc,
      theme: "{{appsmith.theme}}",
      dynamicBindingPathList: [{ key: "theme" }],
    };
  }

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return (widget: CustomWidgetProps, extraDefsToDefine?: ExtraDef) => ({
      isVisible: DefaultAutocompleteDefinitions.isVisible,
      model: generateTypeDef(widget.model, extraDefsToDefine),
    });
  }

  static getSetterConfig(): SetterConfig {
    return {
      __setters: {
        setVisibility: {
          path: "isVisible",
          type: "boolean",
        },
      },
    };
  }

  static getPropertyPaneContentConfig() {
    return [
      {
        sectionName: "Widget",
        children: [
          {
            propertyName: "editSource",
            label: "",
            controlType: "CUSTOM_WIDGET_EDIT_BUTTON_CONTROL",
            isJSConvertible: false,
            isBindProperty: false,
            isTriggerProperty: false,
            dependencies: ["srcDoc", "events", "uncompiledSrcDoc"],
            evaluatedDependencies: ["defaultModel", "theme"],
            dynamicDependencies: (widget: WidgetProps) => widget.events,
            helperText: (
              <div className="leading-5" style={{ marginTop: "10px" }}>
                The source editor lets you add your own HTML, CSS and JS.{" "}
                <StyledLink
                  kind="secondary"
                  rel="noopener noreferrer"
                  target="_blank"
                  to={CUSTOM_WIDGET_DOC_URL}
                >
                  Read more
                </StyledLink>
              </div>
            ),
          },
        ],
      },
      {
        sectionName: "Default Model",
        children: [
          {
            propertyName: "defaultModel",
            helperText: (
              <div className="leading-5" style={{ marginTop: "10px" }}>
                This model exposes Appsmith data to the widget editor.{" "}
                <StyledLink
                  kind="secondary"
                  rel="noopener noreferrer"
                  target="_blank"
                  to={CUSTOM_WIDGET_DOC_URL}
                >
                  Read more
                </StyledLink>
              </div>
            ),
            label: "",
            controlType: "INPUT_TEXT",
            defaultValue: "{}",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.OBJECT,
            },
          },
        ],
      },
      {
        sectionName: "General",
        children: [
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
        ],
      },
      {
        sectionName: "Events",
        hasDynamicProperties: true,
        generateDynamicProperties: (widgetProps: WidgetProps) => {
          return widgetProps.events?.map((event: string) => ({
            propertyName: event,
            label: event,
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
            controlConfig: {
              allowEdit: true,
              onEdit: (widget: CustomWidgetProps, newLabel: string) => {
                return {
                  events: widget.events.map((e) => {
                    if (e === event) {
                      return newLabel;
                    }

                    return e;
                  }),
                };
              },
              allowDelete: true,
              onDelete: (widget: CustomWidgetProps) => {
                return {
                  events: widget.events.filter((e) => e !== event),
                };
              },
            },
            dependencies: ["events"],
          }));
        },
        children: [
          {
            propertyName: "generateEvents",
            label: "",
            controlType: "CUSTOM_WIDGET_ADD_EVENT_BUTTON_CONTROL",
            isJSConvertible: false,
            isBindProperty: false,
            buttonLabel: "Add Event",
            onAdd: (widget: CustomWidgetProps, event: string) => {
              const events = widget.events;

              return {
                events: [...events, event],
              };
            },
            isTriggerProperty: false,
            dependencies: ["events"],
            size: "md",
          },
        ],
      },
    ];
  }

  static getPropertyPaneStyleConfig() {
    return [];
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {};
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      model: "defaultModel",
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      model: undefined,
    };
  }

  execute = (eventName: string, contextObj: Record<string, unknown>) => {
    if (this.props.hasOwnProperty(eventName)) {
      const eventString = this.props[eventName];

      super.executeAction({
        triggerPropertyName: eventName,
        dynamicString: eventString,
        event: {
          type: EventType.CUSTOM_WIDGET_EVENT,
        },
        globalContext: contextObj,
      });
    }
  };

  update = (data: Record<string, unknown>) => {
    this.props.updateWidgetMetaProperty("model", {
      ...this.props.model,
      ...data,
    });
  };

  getRenderMode = () => {
    switch (this.props.renderMode) {
      case "CANVAS":
        return "EDITOR";
      default:
        return "DEPLOYED";
    }
  };

  getWidgetView() {
    return (
      <CustomComponent
        execute={this.execute}
        height={this.props.componentHeight}
        model={this.props.model || {}}
        needsOverlay={
          this.props.renderMode === RenderModes.CANVAS &&
          !this.props.isWidgetSelected
        }
        renderMode={this.getRenderMode()}
        srcDoc={this.props.srcDoc}
        theme={this.props.theme}
        update={this.update}
        width={this.props.componentWidth}
      />
    );
  }
}

export interface CustomWidgetProps extends WidgetProps {
  events: string[];
  theme: AppThemeProperties;
}

export default CustomWidget;
