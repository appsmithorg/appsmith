import React from "react";
import type { KeyValueViewProps } from "../../types";
import { ControlWrapper } from "components/propertyControls/StyledControls";
import { KeyValueComponent } from "components/propertyControls/KeyValueComponent";
import type { SegmentedControlOption } from "@appsmith/ads";

export function KeyValueView(props: KeyValueViewProps) {
  return (
    <ControlWrapper className="key-value-view" isAction key={props.label}>
      <KeyValueComponent
        addLabel={"Query params"}
        pairs={props.get(props.value, false) as SegmentedControlOption[]}
        updatePairs={(pageParams: SegmentedControlOption[]) =>
          props.set(pageParams)
        }
      />
    </ControlWrapper>
  );
}
