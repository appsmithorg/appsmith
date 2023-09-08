import React from "react";
import type { OtherField } from "../../types";
import { OneClickDropdownFieldControl as DropdownField } from "./Field/Dropdown/Dropdown";
import { FieldType } from "widgets/JSONFormWidget/constants";

/*
 *  OtherFieldComponent - this component is specific to one click binding control
 *  This act as a renderer and renders the control based on the fieldType provided by the widget's control config
 *  */
export function OtherFieldComponent({
  defaultValue,
  field,
}: {
  defaultValue?: string;
  field: OtherField;
}) {
  switch (field.fieldType) {
    case FieldType.SELECT:
      return (
        <DropdownField {...field} defaultValue={defaultValue} id={field.name} />
      );
    default:
      return (
        <DropdownField {...field} defaultValue={defaultValue} id={field.name} />
      );
  }
}
