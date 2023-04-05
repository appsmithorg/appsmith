import React from "react";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import type { ColumnProperties } from "widgets/TableWidget/component/Constants";
import { Select, Option } from "design-system";
import type { DropdownOption } from "design-system-old";
import type { DSEventDetail } from "utils/AppsmithUtils";
import {
  DSEventTypes,
  DS_EVENT,
  emitInteractionAnalyticsEvent,
} from "utils/AppsmithUtils";

class PrimaryColumnDropdownControl extends BaseControl<ControlProps> {
  containerRef = React.createRef<HTMLDivElement>();

  componentDidMount() {
    this.containerRef.current?.addEventListener(
      DS_EVENT,
      this.handleAdsEvent as (arg0: Event) => void,
    );
  }

  componentWillUnmount() {
    this.containerRef.current?.removeEventListener(
      DS_EVENT,
      this.handleAdsEvent as (arg0: Event) => void,
    );
  }

  handleAdsEvent = (e: CustomEvent<DSEventDetail>) => {
    if (
      e.detail.component === "Dropdown" &&
      e.detail.event === DSEventTypes.KEYPRESS
    ) {
      emitInteractionAnalyticsEvent(this.containerRef.current, {
        key: e.detail.meta.key,
      });
      e.stopPropagation();
    }
  };

  render() {
    // Get columns from widget properties
    const columns: Record<string, ColumnProperties> =
      this.props.widgetProperties.primaryColumns;
    const options: any[] = [];

    for (const i in columns) {
      options.push({
        label: columns[i].label,
        id: columns[i].id,
        value: i,
      });
    }

    let defaultSelected: DropdownOption = {
      label: "No selection.",
      value: undefined,
    };

    const selected: DropdownOption = options.find(
      (option) => option.value === this.props.propertyValue,
    );

    if (selected) {
      defaultSelected = selected;
    }

    return (
      <div className="w-full h-full" ref={this.containerRef}>
        <Select
          // @ts-expect-error: Type mismatch
          onSelect={this.onItemSelect}
          selected={defaultSelected}
        />
        {options.map((option) => {
          return (
            <Option key={option.value} value={option.value}>
              {option.label}
            </Option>
          );
        })}
      </div>
    );
  }

  onItemSelect = (
    value?: string,
    _option?: DropdownOption,
    isUpdatedViaKeyboard?: boolean,
  ): void => {
    if (value) {
      this.updateProperty(this.props.propertyName, value, isUpdatedViaKeyboard);
    }
  };

  static getControlType() {
    return "PRIMARY_COLUMNS_DROPDOWN";
  }
}

export interface PrimaryColumnDropdownControlProps extends ControlProps {
  propertyValue: string;
}

export default PrimaryColumnDropdownControl;
