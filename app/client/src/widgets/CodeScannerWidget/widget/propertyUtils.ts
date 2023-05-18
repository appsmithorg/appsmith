import type { CodeScannerWidgetProps } from "../constants";
import { Alignment } from "@blueprintjs/core";

export const updateStyles = (
  props: CodeScannerWidgetProps,
  propertyPath: string,
  propertyValue: string,
) => {
  const propertiesToUpdate = [{ propertyPath, propertyValue }];

  if (!props.iconAlign) {
    propertiesToUpdate.push({
      propertyPath: "iconAlign",
      propertyValue: Alignment.LEFT,
    });
  }

  return propertiesToUpdate;
};
