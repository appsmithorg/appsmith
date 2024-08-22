import React from "react";

import { KeyValueComponent } from "components/propertyControls/KeyValueComponent";
import { ControlWrapper } from "components/propertyControls/StyledControls";

import type { SegmentedControlOption } from "@appsmith/ads";

import type { KeyValueViewProps } from "../../types";

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
