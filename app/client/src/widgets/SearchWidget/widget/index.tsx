import React from "react";

import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { DerivedPropertiesMap } from "utils/WidgetFactory";

import SearchComponent from "../component";

class SearchWidget extends BaseWidget<SearchWidgetProps, WidgetState> {
  static getPropertyPaneContentConfig() {
    return [
      {
        sectionName: "Section One",
        children: [
          {
            propertyName: "name",
            label: "Property One",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "name",
            label: "Property Two",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
        ],
      },
      {
        sectionName: "Section Two",
        children: [
          {
            propertyName: "name",
            label: "Property One",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "name",
            label: "Property Two",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
        ],
      },
      {
        sectionName: "Section Three Text",
        children: [
          {
            propertyName: "name",
            label: "Property One",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "name",
            label: "Property Two",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
        ],
      },
      {
        sectionName: "Text Section Four",
        children: [
          {
            propertyName: "name",
            label: "Property One",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "name",
            label: "Property Two",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
        ],
      },
      {
        sectionName: "Text Section Five",
        children: [
          {
            propertyName: "name",
            label: "Text Property One",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "name",
            label: "Property Two",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
        ],
      },
      {
        sectionName: "Section Six Text",
        children: [
          {
            propertyName: "name",
            label: "Text Property One",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "name",
            label: "Property Two",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
        ],
      },
      {
        sectionName: "Section Seven",
        children: [
          {
            propertyName: "name",
            label: "Property One",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "name",
            label: "Property Text Two",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "name",
            label: "Property Three",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
        ],
      },
      {
        sectionName: "Section Eight",
        children: [
          {
            propertyName: "name",
            label: "Property One",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "name",
            label: "Property Two",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "name",
            label: "Text Property Three",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
        ],
      },
      {
        sectionName: "Section Nine",
        children: [
          {
            propertyName: "name",
            label: "Property Text One",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "name",
            label: "Text Property Two",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "name",
            label: "Property Three",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
        ],
      },
    ];
  }

  static getPropertyPaneStyleConfig() {
    return [
      {
        sectionName: "Section One",
        children: [
          {
            propertyName: "name",
            label: "Property One",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "name",
            label: "Property Two",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
        ],
      },
      {
        sectionName: "Section Two",
        children: [
          {
            propertyName: "name",
            label: "Property One",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "name",
            label: "Property Two",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
        ],
      },
      {
        sectionName: "Section Three Text",
        children: [
          {
            propertyName: "name",
            label: "Property One",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "name",
            label: "Property Two",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
        ],
      },
      {
        sectionName: "Text Section Four",
        children: [
          {
            propertyName: "name",
            label: "Property One",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "name",
            label: "Property Two",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
        ],
      },
      {
        sectionName: "Text Section Five",
        children: [
          {
            propertyName: "name",
            label: "Text Property One",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "name",
            label: "Property Two",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
        ],
      },
      {
        sectionName: "Section Six Text",
        children: [
          {
            propertyName: "name",
            label: "Text Property One",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "name",
            label: "Property Two",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
        ],
      },
      {
        sectionName: "Section Seven",
        children: [
          {
            propertyName: "name",
            label: "Property One",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "name",
            label: "Property Text Two",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "name",
            label: "Property Three",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
        ],
      },
      {
        sectionName: "Section Eight",
        children: [
          {
            propertyName: "name",
            label: "Property One",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "name",
            label: "Property Two",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "name",
            label: "Text Property Three",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
        ],
      },
      {
        sectionName: "Section Nine",
        children: [
          {
            propertyName: "name",
            label: "Property Text One",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "name",
            label: "Text Property Two",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "name",
            label: "Property Three",
            controlType: "SWITCH",
            isBindProperty: true,
            isTriggerProperty: false,
          },
        ],
      },
    ];
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {};
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {};
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {};
  }

  getPageView() {
    return <SearchComponent />;
  }

  static getWidgetType(): string {
    return "SEARCH_WIDGET";
  }
}

export interface SearchWidgetProps extends WidgetProps {
  name?: string;
}

export default SearchWidget;
