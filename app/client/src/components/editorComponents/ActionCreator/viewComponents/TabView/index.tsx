import type { TabViewProps } from "../../types";
import {
  ControlWrapper,
  FieldWrapper,
} from "components/propertyControls/StyledControls";
import { SegmentedControl } from "@appsmith/ads";
import React from "react";

interface Option {
  id: string;
  text: string;
  action: () => void;
}

export function TabView(props: TabViewProps) {
  const onClick = (id: string) => {
    const selectedOption = props.switches.find(
      (option: Option) => option.id === id,
    );

    if (selectedOption && selectedOption.action) {
      selectedOption.action();
    }
  };

  return (
    <FieldWrapper className="tab-view">
      <ControlWrapper>
        {props.label && (
          <label className="!text-gray-600 !text-xs" data-testid="tabs-label">
            {props.label}
          </label>
        )}
        <SegmentedControl
          onChange={onClick}
          options={props.switches.map((option: Option) => ({
            label: option.text,
            value: option.id,
          }))}
          // @ts-expect-error fix this the next time the file is edited
          value={props.activeObj.id}
        />
      </ControlWrapper>
    </FieldWrapper>
  );
}
