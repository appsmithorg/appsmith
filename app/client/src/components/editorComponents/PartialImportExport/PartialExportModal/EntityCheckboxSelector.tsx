import { Checkbox } from "@appsmith/ads";
import React from "react";
import { CheckBoxGrid, CheckboxWrapper } from "./StyledSheet";

interface Props {
  containerTestId?: string;
  entities: { id?: string; name: string }[];
  onEntityChecked: (id: string, selected: boolean) => void;
  selectedIds: string[];
}
const EntityCheckboxSelector = ({
  containerTestId,
  entities,
  onEntityChecked,
  selectedIds,
}: Props) => {
  return (
    <CheckboxWrapper data-testid={containerTestId}>
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
