import React from "react";

import type { DerivedPropertiesMap } from "WidgetProvider/factory";

import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";

import CustomComponent from "../component";

import IconSVG from "../icon.svg";
import { WIDGET_TAGS } from "constants/WidgetConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import type { SetterConfig } from "entities/AppTheming";
import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";
import type { AutocompletionDefinitions } from "WidgetProvider/constants";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

class CustomWidget extends BaseWidget<CustomWidgetProps, WidgetState> {
  static type = "CUSTOM_WIDGET";

  static getConfig() {
    return {
      name: "Custom",
      hideCard: !super.getFeatureFlag(
        FEATURE_FLAG.release_custom_widgets_enabled,
      ),
      iconSVG: IconSVG,
      needsMeta: false,
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
      columns: 40,
      version: 1,
      events: [],
      isVisible: true,
      defaultModel: JSON.stringify({
        tips: [
          {
            header: "Custom widget",
            content:
              "Click the **Edit source** button in the right sidebar to customise this widget to your liking.You can pass variables from Appsmith into the custom widget using **Model variables**. Set up **Events** in advance to access them in the source editor.",
          },
          {
            header: "Custom widget",
            content:
              "you can access your primitive model variable in css using var(--appsmith-model-{property-name})",
          },
        ],
      }),
      srcDoc: {
        html: '<!-- no need to write html, head, body tags, it is handled by the widget -->\n<div id="root"></div>\n\n',
        js: 'import React from \'https://cdn.jsdelivr.net/npm/react@18.2.0/+esm\'\nimport reactDom from \'https://cdn.jsdelivr.net/npm/react-dom@18.2.0/+esm\'\nimport { Button, Card } from \'https://cdn.jsdelivr.net/npm/antd@5.11.1/+esm\'\nimport Markdown from \'https://cdn.jsdelivr.net/npm/react-markdown@9.0.1/+esm\'\n\nconst style = {\n\tmaxWidth: "400px",\n}\n\nfunction App() {\n\tconst [currentIndex, setCurrentIndex] = React.useState(0);\n\t\n\tconst [tips, setTips] = React.useState(appsmith.model.tips);\n\n\tconst handleNext = () => {\n\t\tsetCurrentIndex((prevIndex) => (prevIndex + 1) % tips.length);\n\t};\n\n\tconst handleReset = () => {\n\t\tsetCurrentIndex(0);\n\t\tappsmith.triggerEvent("onReset");\n\t};\n\t\n\tReact.useEffect(() => {\n\t\tappsmith.modelProvider.subscribe((model) => {\n\t\t\tsetTips(model.tips);\n\t\t});\n\t}, []);\n\n\treturn (\n\t\t<Card className="app" style={style}>\n\t\t\t<div className="tip-container">\n\t\t\t\t<div className="tip-header">\n\t\t\t\t\t<h2>{tips[currentIndex].header}</h2>\n\t\t\t\t\t<div>{currentIndex + 1} / {tips.length}</div>\n\t\t\t\t</div>\n\t\t\t\t<Markdown>{tips[currentIndex].content}</Markdown>\n\t\t\t</div>\n\t\t\t<div className="button-container">\n\t\t\t\t<Button className="primary" onClick={handleNext} type="primary">Next Tip</Button>\n\t\t\t\t<Button onClick={handleReset}>Reset</Button>\n\t\t\t</div>\n\t</Card>\n);\n}\n\nappsmith.onReady(() => {\n\treactDom.render(<App />, document.getElementById("root"));\n});\n',
        css: "#root {\n\tdisplay: flex;\n\theight: 100vh;\n\twidth: 100vw;\n\tjustify-content: center;\n\talign-items: center;\n}\n\n.app {\n\tjustify-content: center;\n  margin: 20px;\n\tpadding: 5px;\n}\n\n.tip-container {\n  margin-bottom: 20px;\n}\n\n.tip-container h2 {\n  margin-bottom: 20px;\n\tfont-size: 16px;\n\tfont-weight: 700;\n}\n\n.tip-header {\n\tdisplay: flex;\n\tjustify-content: space-between;\n\talign-items: baseline;\n}\n\n.tip-header div {\n\tcolor: #999;\n}\n\n.button-container {\n\ttext-align: right;\t\n}\n\n.button-container button {\n  margin: 0 10px;\n}",
      },
    };
  }

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return {
      isVisible: DefaultAutocompleteDefinitions.isVisible,
    };
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
            dependencies: ["srcDoc", "events"],
            evaluatedDependencies: ["defaultModel"],
            dynamicDependencies: (widget: WidgetProps) => widget.events,
          },
        ],
      },
      {
        sectionName: "Default Model",
        children: [
          {
            propertyName: "defaultModel",
            helperText: (
              <div style={{ marginTop: "10px" }}>
                This model exposes Appsmith data to the widget editor.{" "}
                <a
                  className="decoration-solid underline"
                  href="https://docs.appsmith.com/core-concepts/dynamic-data"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Read more
                </a>
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

  execute = (eventName: string) => {
    if (this.props.hasOwnProperty(eventName)) {
      const eventString = this.props[eventName];

      super.executeAction({
        triggerPropertyName: eventName,
        dynamicString: eventString,
        event: {
          type: EventType.CUSTOM_WIDGET_EVENT,
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
      <CustomComponent
        execute={(eventName: string) => this.execute(eventName)}
        height={this.props.componentHeight}
        model={this.props.model}
        needsOverlay={!this.props.isWidgetSelected}
        srcDoc={this.props.srcDoc}
        update={(data: any) => this.update(data)}
        width={this.props.componentWidth}
      />
    );
  }
}

export interface CustomWidgetProps extends WidgetProps {
  events: string[];
}

export default CustomWidget;
