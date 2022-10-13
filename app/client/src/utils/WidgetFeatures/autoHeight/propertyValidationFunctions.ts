import { WidgetHeightLimits } from "constants/WidgetConstants";
import { WidgetProps } from "widgets/BaseWidget";
import { OverflowTypes } from "widgets/TextWidget/constants";
import { DynamicHeight } from "./contants";

/* Hide the min height and max height properties using this function
   as the `hidden` hook in the property pane configuration
   This function checks if the `dynamicHeight` property is enabled
   and returns true if disabled, and false if enabled.
*/
export function hideDynamicHeightPropertyControl(props: WidgetProps) {
  return props.dynamicHeight !== DynamicHeight.AUTO_HEIGHT_WITH_LIMITS;
}

export function validateMinHeight(value: unknown, props: WidgetProps) {
  const _value: number = parseInt(value as string, 10);
  const _maxHeight: number = parseInt(props.maxDynamicHeight as string, 10);

  if (isNaN(_value) || _value < 4) {
    return {
      isValid: false,
      messages: [`Value should be a positive integer greater than 4`],
      parsed: 4,
    };
  } else if (_value > _maxHeight) {
    return {
      isValid: false,
      messages: [`Value should be less than or equal Max. Height`],
      parsed: _maxHeight || 4,
    };
  }

  return {
    isValid: true,
    parsed: _value,
    messages: [],
  };
}

export function validateMaxHeight(value: unknown, props: WidgetProps) {
  const _value: number = parseInt(value as string, 10);
  const _minHeight: number = parseInt(props.minDynamicHeight as string, 10);

  if (isNaN(_value) || _value < 4) {
    return {
      isValid: false,
      messages: [`Value should be a positive integer greater than 4`],
      parsed: 100,
    };
  } else if (_value < _minHeight) {
    return {
      isValid: false,
      messages: [`Value should be greater than or equal Min. Height`],
      parsed: _minHeight || 4,
    };
  }
  return {
    isValid: true,
    parsed: _value,
    messages: [],
  };
}
// TODO (abhinav): ADD_UNIT_TESTS
export function updateMinMaxDynamicHeight(
  props: WidgetProps,
  propertyName: string,
  propertyValue: unknown,
) {
  const updates = [
    {
      propertyPath: propertyName,
      propertyValue: propertyValue,
    },
  ];

  if (propertyValue === DynamicHeight.AUTO_HEIGHT_WITH_LIMITS) {
    const minDynamicHeight = parseInt(props.minDynamicHeight, 10);

    if (
      isNaN(minDynamicHeight) ||
      minDynamicHeight < WidgetHeightLimits.MIN_HEIGHT_IN_ROWS
    ) {
      updates.push({
        propertyPath: "minDynamicHeight",
        propertyValue: WidgetHeightLimits.MIN_HEIGHT_IN_ROWS,
      });
    }
    const maxDynamicHeight = parseInt(props.maxDynamicHeight, 10);
    if (
      isNaN(maxDynamicHeight) ||
      maxDynamicHeight > props.bottomRow - props.topRow
    ) {
      updates.push({
        propertyPath: "maxDynamicHeight",
        propertyValue: props.bottomRow - props.topRow,
      });
    }

    // Case where maxDynamicHeight is zero
    if (isNaN(maxDynamicHeight) || maxDynamicHeight === 0) {
      updates.push({
        propertyPath: "maxDynamicHeight",
        propertyValue: props.bottomRow - props.topRow,
      });
    }
  } else if (propertyValue === DynamicHeight.AUTO_HEIGHT) {
    updates.push(
      {
        propertyPath: "minDynamicHeight",
        propertyValue: WidgetHeightLimits.MIN_HEIGHT_IN_ROWS,
      },
      {
        propertyPath: "maxDynamicHeight",
        propertyValue: WidgetHeightLimits.MAX_HEIGHT_IN_ROWS,
      },
    );
  }

  if (
    (propertyValue === DynamicHeight.AUTO_HEIGHT ||
      propertyValue === DynamicHeight.AUTO_HEIGHT_WITH_LIMITS) &&
    props.shouldScrollContents === false
  ) {
    updates.push({
      propertyPath: "shouldScrollContents",
      propertyValue: true,
    });
  }

  if (props.type === "TEXT_WIDGET") {
    // TODO(abhinav): Abstraction leak
    updates.push({
      propertyPath: "overflow",
      propertyValue: OverflowTypes.NONE, // TODO(abhinav): Abstraction leak
    });
  }

  return updates;
}

export function transformToNumber(
  props: WidgetProps,
  propertyName: string,
  propertyValue: string,
) {
  return [
    {
      propertyPath: propertyName,
      propertyValue: parseInt(propertyValue, 10),
    },
  ];
}
