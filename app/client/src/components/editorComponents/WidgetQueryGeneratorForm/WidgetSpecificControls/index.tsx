import React from "react";
import ColumnDropdown from "./ColumnDropdown";
import { noop } from "lodash";
import type { Alias, OtherField } from "../types";
import { OtherFieldComponent } from "./OtherFields";
import { useFormConfig } from "../common/useFormConfig";

interface Props {
  hasSearchableColumn?: boolean;
  aliases?: Alias[];
  otherFields?: OtherField[];
}

export default function WidgetSpecificControls(props: Props) {
  let searchableColumn = null;
  let aliases = null;
  let otherFields = null;
  const formConfig: Record<string, unknown> = useFormConfig();

  if (props.hasSearchableColumn) {
    searchableColumn = (
      <ColumnDropdown
        alias="searchableColumn"
        id="searchableColumn"
        isSearcheable
        label="Select a searchable column"
        onSelect={noop}
      />
    );
  }

  if (props.aliases?.length) {
    aliases = props.aliases.map(({ isSearcheable, name }) => {
      const label = name.slice(0, 1).toUpperCase() + name.slice(1);

      return (
        <ColumnDropdown
          alias={`alias.${name}`}
          id={name}
          isSearcheable={!!isSearcheable}
          key={name}
          label={label}
          onSelect={noop}
        />
      );
    });
  }

  if (props.otherFields?.length) {
    otherFields = props.otherFields.map((field) => {
      const isVisible = field.isVisible && field.isVisible(formConfig);
      const defaultValue =
        field.getDefaultValue &&
        field.getDefaultValue?.({ primaryColumn: formConfig.primaryColumn });

      return isVisible ? (
        <OtherFieldComponent
          defaultValue={defaultValue}
          field={field}
          key={field.name}
        />
      ) : null;
    });
  }

  return (
    <>
      {searchableColumn}
      {aliases}
      {otherFields}
    </>
  );
}
