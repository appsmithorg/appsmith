import React from "react";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import type { ColumnProperties } from "widgets/TableWidget/component/Constants";
import type { SegmentedControlOption } from "@appsmith/ads";
import { Select, Option } from "@appsmith/ads";
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const options: any[] = [];

    for (const i in columns) {
      options.push({
        label: columns[i].label,
        id: columns[i].id,
        value: i,
      });
    }

    const selected: SegmentedControlOption = options.find(
      (option) => option.value === this.props.propertyValue,
    );

    return (
      <div className="w-full h-full" ref={this.containerRef}>
        <Select
          onSelect={this.onItemSelect}
          placeholder="No selection."
          value={selected ? selected.value : undefined}
        >
          {options.map((option) => (
            <Option key={option.id} value={option.value}>
              {option.label}
            </Option>
          ))}
        </Select>
      </div>
    );
  }

  onItemSelect = (value?: string): void => {
    if (value) {
      this.updateProperty(this.props.propertyName, value);
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
