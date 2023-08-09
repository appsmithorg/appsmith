import React from "react";
import ColumnDropdown from "./ColumnDropdown";
import { noop } from "lodash";
import type { Alias } from "../types";

type Props = {
  hasSearchableColumn?: boolean;
  aliases?: Alias[];
};

export default function WidgetSpecificControls(props: Props) {
  let searchableColumn = null;
  let aliases = null;

  if (props.hasSearchableColumn) {
    searchableColumn = (
      <ColumnDropdown
        alias="searchableColumn"
        id="searchableColumn"
        label="Select a searchable column"
        onSelect={noop}
      />
    );
  }

  if (props.aliases?.length) {
    aliases = props.aliases.map(({ name }) => {
      const label = name.slice(0, 1).toUpperCase() + name.slice(1);

      return (
        <ColumnDropdown
          alias={`alias.${name}`}
          id={name}
          key={name}
          label={label}
          onSelect={noop}
        />
      );
    });
  }

  return (
    <>
      {searchableColumn}
      {aliases}
    </>
  );
}
