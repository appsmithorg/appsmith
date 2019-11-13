import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "../constants/WidgetConstants";
import { ActionPayload } from "../constants/ActionConstants";
import DropDownComponent from "../components/designSystems/blueprint/DropdownComponent";
import _ from "lodash";

class DropdownWidget extends BaseWidget<DropdownWidgetProps, WidgetState> {
  getPageView() {
    return (
      <DropDownComponent
        onOptionSelected={this.onOptionSelected}
        onOptionRemoved={this.onOptionRemoved}
        widgetId={this.props.widgetId}
        placeholder={this.props.placeholderText}
        options={this.props.options || []}
        selectionType={this.props.selectionType}
        selectedIndex={this.props.selectedIndex || 0}
        selectedIndexArr={this.props.selectedIndexArr || []}
        label={this.props.label}
      />
    );
  }

  onOptionSelected = (selectedOption: DropdownOption) => {
    const selectedIndex = _.findIndex(this.props.options, option => {
      return option.value === selectedOption.value;
    });
    if (this.props.selectionType === "SINGLE_SELECT") {
      this.context.updateWidgetProperty(
        this.props.widgetId,
        "selectedIndex",
        selectedIndex,
      );
    } else if (this.props.selectionType === "MULTI_SELECT") {
      const selectedIndexArr = this.props.selectedIndexArr || [];
      const isAlreadySelected =
        _.find(selectedIndexArr, index => {
          return index === selectedIndex;
        }) !== undefined;
      if (isAlreadySelected) {
        this.onOptionRemoved(selectedIndex);
      } else {
        selectedIndexArr.push(selectedIndex);
        this.context.updateWidgetProperty(
          this.props.widgetId,
          "selectedIndexArr",
          selectedIndexArr,
        );
      }
    }
    super.executeAction(this.props.onOptionChange);
  };

  onOptionRemoved = (removedIndex: number) => {
    const updateIndexArr = this.props.selectedIndexArr
      ? this.props.selectedIndexArr.filter(index => {
          return removedIndex !== index;
        })
      : [];
    this.context.updateWidgetProperty(
      this.props.widgetId,
      "selectedIndexArr",
      updateIndexArr,
    );
    super.executeAction(this.props.onOptionChange);
  };

  getWidgetType(): WidgetType {
    return "DROP_DOWN_WIDGET";
  }
}

export type SelectionType = "SINGLE_SELECT" | "MULTI_SELECT";
export interface DropdownOption {
  label: string;
  value: string;
}

export interface DropdownWidgetProps extends WidgetProps {
  placeholderText?: string;
  label?: string;
  selectedIndex?: number;
  selectedIndexArr?: number[];
  selectionType: SelectionType;
  options?: DropdownOption[];
  onOptionChange?: ActionPayload[];
}

export default DropdownWidget;
