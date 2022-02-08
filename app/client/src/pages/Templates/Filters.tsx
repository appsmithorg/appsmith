import React, { useState } from "react";
import styled from "styled-components";
import { Collapse } from "@blueprintjs/core";
import { Classes } from "components/ads/common";
import Text, { TextType } from "components/ads/Text";
import Icon, { IconSize } from "components/ads/Icon";

const Wrapper = styled.div`
  overflow: auto;
  height: 100%;
  box-shadow: 1px 0px 0px #ededed;
  width: ${(props) => props.theme.homePage.sidebar}px;
  padding-left: 32px;
  padding-top: 34px;

  .more {
    padding-left: 10px;
    margin-top: 7px;
    cursor: pointer;
  }
`;

const StyledFilterItem = styled.div<{ selected: boolean }>`
  cursor: pointer;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding-left: 10px;
  padding: 7px 15px 7px 10px;
  .${Classes.TEXT} {
    color: #121826;
  }
  ${(props) =>
    props.selected &&
    `
    background-color: #ebebeb;
    .${Classes.TEXT} {
      color: #22223B;
    }
  `}

  &:hover {
    background-color: #ebebeb;
  }
`;

const StyledFilterCategory = styled(Text)`
  margin-bottom: 10px;
`;

const ListWrapper = styled.div`
  margin-top: 10px;
`;

interface FilterItemProps {
  label: string;
  onSelect: (item: string, action: string) => void;
}

function FilterItem({ label, onSelect }: FilterItemProps) {
  const [selected, setSelected] = useState(false);

  const onClick = () => {
    const action = selected ? "remove" : "add";
    onSelect(label, action);
    setSelected((selected) => !selected);
  };

  return (
    <StyledFilterItem onClick={onClick} selected={selected}>
      <Text color="#121826" type={TextType.P1}>
        {label}
      </Text>
      {selected && <Icon name={"close-x"} size={IconSize.SMALL} />}
    </StyledFilterItem>
  );
}

function Filters() {
  const filters: string[] = [
    "Customer Support",
    "Data & Analytics",
    "DevOps",
    "Api",
    "DevOps",
  ];
  const [selectedItems, setSelectedItem] = useState<string[]>([]);
  const [expand, setExpand] = useState(false);
  const onSelect = (item: string, type: string) => {
    if (type === "add") {
      setSelectedItem((selectedItems) => [...selectedItems, item]);
    } else {
      setSelectedItem((selectedItems) =>
        selectedItems.filter((selectedItem) => selectedItem !== item),
      );
    }
  };

  const toggleExpand = () => {
    setExpand((expand) => !expand);
  };

  return (
    <Wrapper>
      <StyledFilterCategory type={TextType.BUTTON_MEDIUM}>
        FUNCTION
      </StyledFilterCategory>
      <ListWrapper>
        {filters.slice(0, 3).map((filter) => {
          return <FilterItem key={filter} label={filter} onSelect={onSelect} />;
        })}
        {!expand && (
          <Text
            className={"more"}
            onClick={toggleExpand}
            type={TextType.BUTTON_SMALL}
            underline
          >
            + {filters.slice(3).length} MORE
          </Text>
        )}
        <Collapse isOpen={expand}>
          {filters.slice(3).map((filter) => {
            return (
              <FilterItem key={filter} label={filter} onSelect={onSelect} />
            );
          })}
        </Collapse>
        {expand && !selectedItems.length && (
          <Text
            className={"more"}
            onClick={toggleExpand}
            type={TextType.BUTTON_SMALL}
            underline
          >
            - SHOW LESS
          </Text>
        )}
      </ListWrapper>
    </Wrapper>
  );
}

export default Filters;
