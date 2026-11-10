import { Checkbox, Text } from "@appsmith/ads";
import { PARTIAL_IMPORT_EXPORT, createMessage } from "ee/constants/messages";
import React from "react";
import { CheckBoxGrid, CheckboxWrapper } from "./StyledSheet";

interface Props {
  containerTestId?: string;
  entities: { id?: string; name: string }[];
  onEntityChecked: (id: string, selected: boolean) => void;
  onSelectAll?: (ids: string[], selected: boolean) => void;
  selectAllTestId?: string;
  selectedIds: string[];
}
const EntityCheckboxSelector = ({
  containerTestId,
  entities,
  onEntityChecked,
  onSelectAll,
  selectAllTestId,
  selectedIds,
}: Props) => {
  const entityIds = entities.map((entity) => entity.id || entity.name);
  const isAllSelected = entityIds.every((id) => selectedIds.includes(id));

  return (
    <CheckboxWrapper data-testid={containerTestId}>
      {onSelectAll && entityIds.length > 0 && (
        <Checkbox
          className="mb-4"
          data-testid={selectAllTestId}
          isSelected={isAllSelected}
          onChange={(isSelected) => onSelectAll(entityIds, isSelected)}
        >
          <Text kind="body-m" renderAs="p">
            {createMessage(PARTIAL_IMPORT_EXPORT.export.selectAll)}
          </Text>
        </Checkbox>
      )}
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
