import React from "react";
import type { OtherField } from "../../types";
import { useFormConfig } from "../../common/useFormConfig";
import { OneClickDropdownFieldControl as DropdownField } from "./Field/Dropdown/Dropdown";
import { FieldType } from "../../../../../widgets/JSONFormWidget/constants";

export function OtherFieldComponent({ field }: { field: OtherField }) {
  const formConfig: Record<string, unknown> = useFormConfig();
  const isVisible = field.isVisible && field.isVisible(formConfig);
  if (isVisible) {
    if (field.fieldType === FieldType.SELECT) {
      return <DropdownField {...field} id={field.name} />;
    }
  }
  return null;
}
