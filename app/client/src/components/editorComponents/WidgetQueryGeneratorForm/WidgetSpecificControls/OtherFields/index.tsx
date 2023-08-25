import React from "react";
import type { OtherField } from "../../types";
import { useFormConfig } from "../../common/useFormConfig";
import { OneClickDropdownFieldControl as DropdownField } from "./Field/Dropdown";

export function OtherFieldComponent({ field }: { field: OtherField }) {
  const formConfig = useFormConfig();
  const isVisible = field.isVisible && field.isVisible(formConfig);
  if (isVisible) {
    if (field.fieldType === "SELECT") {
      // TODO: get from Enums
      return <DropdownField {...field} id={field.name} />;
    }
  }
  return null;
}
