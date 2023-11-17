import { Checkbox } from "design-system";
import React from "react";
import { CheckBoxGrid, CheckboxWrapper } from "./StyledSheet";

interface Props {
  entities: { id?: string; name: string }[];
  onEntityChecked: (id: string, selected: boolean) => void;
  selectedIds: string[];
}
const EntityCheckboxSelector = ({
  entities,
  onEntityChecked,
  selectedIds,
}: Props) => {
  return (
    <CheckboxWrapper>
      <CheckBoxGrid>
        {entities.map((ds) => (
          <Checkbox
            isSelected={selectedIds.includes(ds.id || ds.name)}
            key={ds.id || ds.name}
            onChange={(isSelected) =>
              onEntityChecked(ds.id || ds.name, isSelected)
            }
          >
            {ds.name}
          </Checkbox>
        ))}
      </CheckBoxGrid>
    </CheckboxWrapper>
  );
};

export default EntityCheckboxSelector;
