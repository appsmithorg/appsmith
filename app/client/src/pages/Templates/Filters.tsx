import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useDispatch } from "react-redux";
import { Collapse } from "@blueprintjs/core";
import { Classes } from "components/ads/common";
import Text, { TextType } from "components/ads/Text";
import Icon, { IconSize } from "components/ads/Icon";
import { filterTemplates } from "actions/templateActions";

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

type Filter = {
  label: string;
  value?: string;
};

interface FilterItemProps {
  item: Filter;
  onSelect: (item: string, action: string) => void;
}

interface FilterCategoryProps {
  label: string;
  filterList: Filter[];
}

const useGetFilterList = (): Record<string, Filter[]> => {
  const functions = [
    {
      label: "Technology",
    },
    { label: "Health Care" },
    { label: "Financials" },
    { label: "Consumer Discretionary" },
    { label: "Communication Services" },
    { label: "Industrials" },
    { label: "Consumer goods" },
    { label: "Energy" },
    { label: "Utilities" },
    { label: "Real Estate" },
    { label: "Materials" },
    { label: "Agriculture" },
    { label: "Services" },
    { label: "Other" },
    { label: "E-Commerce" },
    { label: "Start-up" },
    { label: "textile" },
  ];
  // const useCases = [
  //   "Support",
  //   "Marketing",
  //   "Sales",
  //   "Finance",
  //   "Information Technology (IT)",
  //   "Human Resources (HR)",
  //   "Communications",
  //   "Legal",
  //   "Public Relations (PR)",
  //   "Product, design, and UX",
  //   "Project Management",
  //   "Personal",
  //   "Remote work",
  //   "Software Development",
  // ];
  // const widgetConfigs = useSelector(getWidgetCards);

  const filters = {
    functions,
  };

  return filters;
};

function FilterItem({ item, onSelect }: FilterItemProps) {
  const [selected, setSelected] = useState(false);

  const onClick = () => {
    const action = selected ? "remove" : "add";
    onSelect(item?.value ?? item.label, action);
    setSelected((selected) => !selected);
  };

  return (
    <StyledFilterItem onClick={onClick} selected={selected}>
      <Text color="#121826" type={TextType.P1}>
        {item.label}
      </Text>
      {selected && <Icon name={"close-x"} size={IconSize.SMALL} />}
    </StyledFilterItem>
  );
}

function FilterCategory({ filterList, label }: FilterCategoryProps) {
  const [selectedItems, setSelectedItem] = useState<string[]>([]);
  const [expand, setExpand] = useState(false);
  const dispatch = useDispatch();
  const onSelect = (item: string, type: string) => {
    if (type === "add") {
      setSelectedItem((selectedItems) => [...selectedItems, item]);
    } else {
      setSelectedItem((selectedItems) =>
        selectedItems.filter((selectedItem) => selectedItem !== item),
      );
    }
    dispatch(filterTemplates(label, selectedItems));
  };

  useEffect(() => {
    dispatch(filterTemplates(label, selectedItems));
  }, [selectedItems]);

  const toggleExpand = () => {
    setExpand((expand) => !expand);
  };

  return (
    <>
      <StyledFilterCategory type={TextType.BUTTON_MEDIUM}>
        {label.toLocaleUpperCase()}
      </StyledFilterCategory>
      <ListWrapper>
        {filterList.slice(0, 3).map((filter) => {
          return (
            <FilterItem item={filter} key={filter.label} onSelect={onSelect} />
          );
        })}
        {!expand && (
          <Text
            className={"more"}
            onClick={toggleExpand}
            type={TextType.BUTTON_SMALL}
            underline
          >
            + {filterList.slice(3).length} MORE
          </Text>
        )}
        <Collapse isOpen={expand}>
          {filterList.slice(3).map((filter) => {
            return (
              <FilterItem
                item={filter}
                key={filter.label}
                onSelect={onSelect}
              />
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
    </>
  );
}

function Filters() {
  const filters = useGetFilterList();

  return (
    <Wrapper>
      {Object.keys(filters).map((filter) => {
        return (
          <FilterCategory
            filterList={filters[filter]}
            key={filter}
            label={filter}
          />
        );
      })}
    </Wrapper>
  );
}

export default Filters;
