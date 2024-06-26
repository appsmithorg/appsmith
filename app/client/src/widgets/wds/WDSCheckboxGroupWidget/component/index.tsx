import React from "react";
import { Checkbox } from "@design-system/widgets";
import { ToggleGroup } from "@design-system/widgets";

import { useDebouncedValue } from "@mantine/hooks";
import type { CheckboxGroupComponentProps } from "../widget/types";

const DEBOUNCE_TIME = 300;

export function CheckboxGroupComponent(props: CheckboxGroupComponentProps) {
  const {
    disableWidgetInteraction,
    errorMessage: errorMessageProp,
    labelTooltip,
    onChange,
    options,
    selectedValues,
    validationStatus: validationStatusProp,
    widgetId,
    ...rest
  } = props;
  // Note: because of how derived props are handled by MetaHoc, the isValid shows wrong
  // values for some milliseconds. To avoid that, we are using debounced value.
  const [validationStatus] = useDebouncedValue(
    validationStatusProp,
    DEBOUNCE_TIME,
  );
  const [errorMessage] = useDebouncedValue(errorMessageProp, DEBOUNCE_TIME);

  return (
    <ToggleGroup
      {...rest}
      contextualHelp={labelTooltip}
      errorMessage={errorMessage}
      isInvalid={validationStatus === "invalid"}
      items={options}
      onChange={onChange}
      value={selectedValues}
    >
      {({ index, label, value }) => (
        <Checkbox
          excludeFromTabOrder={disableWidgetInteraction}
          key={`${widgetId}-option-${index}`}
          value={value}
        >
          {label}
        </Checkbox>
      )}
    </ToggleGroup>
  );
}
