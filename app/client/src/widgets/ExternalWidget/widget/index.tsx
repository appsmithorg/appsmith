import React from "react";

import BaseWidget from "widgets/BaseWidget";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";

import IconSVG from "../icon.svg";

import ExternalComponent from "../component";

import type { DerivedPropertiesMap } from "WidgetProvider/factory";
import { WIDGET_TAGS } from "constants/WidgetConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import type { OnButtonClickProps } from "components/propertyControls/ButtonControl";

class ExternalWidget extends BaseWidget<ExternalWidgetProps, WidgetState> {
  static type = "EXTERNAL_WIDGET";

  static getConfig() {
    return {
      name: "Custom Widget [alpha]",
      hideCard: true,
      iconSVG: IconSVG,
      needsMeta: true,
      isCanvas: false,
      tags: [WIDGET_TAGS.DISPLAY],
    };
  }

  static getDefaults() {
    return {
      widgetName: "CustomWidget",
      rows: 50,
      columns: 50,
      version: 1,
      events: [],
      srcDoc: {
        html: "<!-- no need to write html, head, body tags, it is handled by the widget -->",
        js: "// no need to write window onLoad, it is handled by the widget",
        css: "/* you can access your string properties of your model using `var(--appsmith-model-<property-name>)`*/",
      },
    };
  }

  static getPropertyPaneContentConfig() {
    return [
      {
        sectionName: "Data",
        children: [
          {
            propertyName: "defaultModel",
            helpText: "The data that needs to be injected into the widget",
            label: "Model",
            controlType: "INPUT_TEXT",
            placeholderText: "{}",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.OBJECT,
            },
          },
          // {
          //   propertyName: "isHosted",
          //   label: "is your component hosted somewhere?",
          //   controlType: "SWITCH",
          //   isBindProperty: false,
          //   isTriggerProperty: false,
          // },
          {
            propertyName: "srcDoc",
            helpText: "Inline HTML to embed, overriding the src attribute",
            label: "srcDoc",
            controlType: "HTML_DOCUMENT_BUILDER",
            placeholderText: "<p>Inline HTML</p>",
            isBindProperty: true,
            isTriggerProperty: false,
            hidden: (widget: WidgetProps) => {
              return widget.isHosted;
            },
            dependencies: ["isHosted"],
            evaluatedDependencies: ["defaultModel"],
          },
          {
            propertyName: "src",
            helpText: "Url of the hosted widget",
            label: "src",
            controlType: "HTML_DOCUMENT_BUILDER",
            placeholderText: "https://deployed.somewhere.com/mycomponent",
            isBindProperty: false,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
            },
            hidden: (widget: WidgetProps) => {
              return !widget.isHosted;
            },
            dependencies: ["isHosted"],
          },
        ],
      },
      {
        sectionName: "Events",
        hasDynamicProperties: true,
        generateDynamicProperties: (widgetProps: WidgetProps) => {
          return widgetProps.events.map((event: string) => ({
            propertyName: event,
            label: event,
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          }));
        },
        children: [
          {
            propertyName: "generateFormButton",
            label: "",
            controlType: "BUTTON",
            isJSConvertible: false,
            isBindProperty: false,
            buttonLabel: "Add Event",
            onClick: ({
              batchUpdateProperties,
              widgetProperties,
            }: OnButtonClickProps) => {
              const events = widgetProperties.events;

              const eventName = prompt("what is the event name");

              batchUpdateProperties({
                events: [...events, eventName],
              });
            },
            isTriggerProperty: false,
            dependencies: ["events"],
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

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getMetaPropertiesMap(): Record<string, any> {
    return {
      model: {},
    };
  }

  execute = (eventName: string) => {
    if (this.props.hasOwnProperty(eventName)) {
      const eventString = this.props[eventName];

      super.executeAction({
        triggerPropertyName: eventName,
        dynamicString: eventString,
        event: {
          type: EventType.ON_SUBMIT,
        },
      });
    }
  };

  update = (data: Record<string, unknown>) => {
    this.props.updateWidgetMetaProperty("model", {
      ...this.props.model,
      ...data,
    });
  };

  getWidgetView() {
    return (
      <ExternalComponent
        execute={(eventName: string) => this.execute(eventName)}
        height={this.props.componentHeight}
        model={this.props.model}
        srcDoc={this.props.srcDoc}
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        update={(data: any) => this.update(data)}
        width={this.props.componentWidth}
      />
    );
  }
}

export interface ExternalWidgetProps extends WidgetProps {
  something?: boolean;
}

export default ExternalWidget;
