import React from "react";
import styled from "styled-components";
import { Link } from "@appsmith/ads";
import type { WidgetProps } from "widgets/BaseWidget";
import { ValidationTypes } from "constants/WidgetValidation";
import {
  CUSTOM_WIDGET_DEFAULT_MODEL_DOC_URL,
  CUSTOM_WIDGET_DOC_URL,
} from "pages/Editor/CustomWidgetBuilder/constants";

import type { CustomWidgetProps } from "../../types";

const StyledLink = styled(Link)`
  display: inline-block;
  span {
    font-size: 12px;
  }
`;

export const propertyPaneContentConfig = [
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
              to={CUSTOM_WIDGET_DEFAULT_MODEL_DOC_URL}
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
            const triggerPaths = [];
            const updatedProperties = {
              events: widget.events.map((e) => {
                if (e === event) {
                  return newLabel;
                }

                return e;
              }),
            };

            if (
              widget.dynamicTriggerPathList?.map((d) => d.key).includes(event)
            ) {
              triggerPaths.push(newLabel);
            }

            return {
              modify: updatedProperties,
              triggerPaths,
            };
          },
          allowDelete: true,
          onDelete: (widget: CustomWidgetProps) => {
            return {
              events: widget.events.filter((e) => e !== event),
            };
          },
        },
        dependencies: ["events", "dynamicTriggerPathList"],
        helpText: "when the event is triggered from custom widget",
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
