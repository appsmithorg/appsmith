import React from "react";
import type { OtherField } from "../../types";
import { OneClickDropdownFieldControl as DropdownField } from "./Field/Dropdown/Dropdown";
import { FieldType } from "../../../../../widgets/JSONFormWidget/constants";

export function OtherFieldComponent({ field }: { field: OtherField }) {
  switch (field.fieldType) {
    case FieldType.SELECT:
      return <DropdownField {...field} id={field.name} />;
    default:
      return <DropdownField {...field} id={field.name} />;
  }
}
