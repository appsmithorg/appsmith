import React from "react";
import { compact, uniqueId, xor } from "lodash";

import {
  ValidationResponse,
  ValidationTypes,
} from "constants/WidgetValidation";
import { TextSize, WidgetType } from "constants/WidgetConstants";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";

import {
  CheckboxGroupAlignmentTypes,
  LabelPosition,
} from "components/constants";
import { Alignment } from "@blueprintjs/core";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";

import AccordionComponent, { AccordionItem } from "../component";

class AccordionWidget extends BaseWidget<AccordionWidgetProps, WidgetState> {
  static getPropertyPaneContentConfig() {
    return [
      {
        sectionName: "Data",
        children: [
          {
            helpText:
              "Displays a list of options for a user to select. Values must be unique",
            propertyName: "options",
            label: "Options",
            controlType: "INPUT_TEXT",
            placeholderText: '[{ "label": "Option1", "value": "Option2" }]',
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
            },
            evaluationSubstitutionType:
              EvaluationSubstitutionType.SMART_SUBSTITUTE,
          },
        ],
      },
    ];
  }

  componentDidMount(): void {
    const accordionItems = this.props.accordionItems;
    if (accordionItems === undefined) {
      if (Array.isArray(this.props.options)) {
        this.props.updateWidgetMetaProperty(
          "accordionItems",
          this.props.options.map(
            (option: { label: string; value: string }) => ({
              content: option.value,
              id: uniqueId(),
              isExpanded: false,
              title: option.label,
            }),
          ),
        );
      }
    }
  }

  componentDidUpdate(prevProps: AccordionWidgetProps) {
    console.log("Accordion componentDidUpdate");
  }

  private handleOnAccordionHeaderClick = (item: AccordionItem) => {
    const changedItems = this.props.accordionItems.map(
      (accordionItem: AccordionItem) => {
        if (accordionItem.id === item.id) {
          return {
            ...accordionItem,
            isExpanded: !accordionItem.isExpanded,
          };
        }

        return accordionItem;
      },
    );

    this.props.updateWidgetMetaProperty("accordionItems", changedItems);
  };

  getPageView() {
    console.log("AccordionWidget", this.props.accordionItems);
    return (
      <AccordionComponent
        items={this.props.accordionItems || []}
        onChange={this.handleOnAccordionHeaderClick}
        widgetId={this.props.widgetId}
      />
    );
  }

  static getWidgetType(): WidgetType {
    return "ACCORDION_WIDGET";
  }
}

export interface AccordionWidgetProps extends WidgetProps {
  hello?: boolean;
}

export default AccordionWidget;
