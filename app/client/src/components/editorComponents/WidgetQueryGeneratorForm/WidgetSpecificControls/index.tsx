import React from "react";
import ColumnDropdown from "./ColumnDropdown";
import { Section } from "../styles";
import { noop } from "lodash";

type Props = {
  hasSearchableColumn?: boolean;
  hasAliasPicker?: boolean;
  aliases?: string[];
};

export default function WidgetSpecificControls(props: Props) {
  let searchableColumn = null;
  let aliasPicker = null;

  if (props.hasSearchableColumn) {
    searchableColumn = (
      <ColumnDropdown label="Searchable column" onSelect={noop} />
    );
  }

  if (props.hasAliasPicker && props.aliases) {
    aliasPicker = props.aliases.map((alias) => {
      <ColumnDropdown label={alias} onSelect={noop} />;
    });
  }

  return (
    <Section>
      {searchableColumn}
      {aliasPicker}
    </Section>
  );
}
