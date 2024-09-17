import React from "react";
import { Flex, Button, SearchInput } from "@appsmith/ads";

interface Props {
  onAddClick: () => void;
  hasAddPermission: boolean;
  onSearch: (value: string) => void;
}

const AddAndSearchbar = ({ hasAddPermission, onAddClick, onSearch }: Props) => {
  return (
    <Flex alignItems="center" flexDirection="row" gap="spaces-3">
      <SearchInput onChange={onSearch} size="sm" />
      {hasAddPermission ? (
        <Button
          className="t--add-item !min-w-[24px]"
          data-testid="t--add-item"
          isIconButton
          kind={"secondary"}
          onClick={onAddClick}
          size={"sm"}
          startIcon={"add-line"}
        />
      ) : null}
    </Flex>
  );
};

export { AddAndSearchbar };
