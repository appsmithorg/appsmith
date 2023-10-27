import { Checkbox } from "design-system";
import React from "react";
import { CheckboxWrapper } from "./StyledSheet";

interface Props {
  entities: { id?: string; name: string }[];
}
const EntityCheckboxSelector = ({ entities }: Props) => {
  return (
    <CheckboxWrapper>
      {entities.map((ds) => (
        <Checkbox key={ds.id || ds.name}>{ds.name}</Checkbox>
      ))}
    </CheckboxWrapper>
  );
};

export default EntityCheckboxSelector;
