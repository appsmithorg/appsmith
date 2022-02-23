import React, { useEffect, useState, useMemo } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { Collapse } from "@blueprintjs/core";
import { Classes } from "components/ads/common";
import Text, { TextType } from "components/ads/Text";
import Icon, { IconSize } from "components/ads/Icon";
import { filterTemplates } from "actions/templateActions";
import { getWidgetCards } from "selectors/editorSelectors";
import { createMessage, MORE, SHOW_LESS } from "@appsmith/constants/messages";
import { templatesDatasourceFiltersSelector } from "selectors/templatesSelectors";
import LeftPaneBottomSection from "pages/Home/LeftPaneBottomSection";
import { thinScrollbar } from "constants/DefaultTheme";
import { functions, useCases } from "./constants";
import { Colors } from "constants/Colors";

const FilterWrapper = styled.div`
  overflow: auto;
  height: calc(100vh - ${(props) => props.theme.homePage.header + 200}px);
  ${thinScrollbar}

  .more {
    padding-left: ${(props) => props.theme.spaces[4]}px;
    margin-top: ${(props) => props.theme.spaces[2]}px;
    cursor: pointer;
  }
`;

const Wrapper = styled.div`
  width: ${(props) => props.theme.homePage.sidebar}px;
  height: 100%;
  display: flex;
  padding-left: ${(props) => props.theme.spaces[7]}px;
  padding-top: ${(props) => props.theme.spaces[11]}px;
  flex-direction: column;
  box-shadow: 1px 0px 0px ${Colors.GALLERY_2};
`;

const SecondWrapper = styled.div`
  height: calc(
    100vh - ${(props) => props.theme.homePage.header + props.theme.spaces[11]}px
  );
  position: relative;
`;

const StyledFilterItem = styled.div<{ selected: boolean }>`
  cursor: pointer;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: ${(props) =>
    `${props.theme.spaces[2]}px ${props.theme.spaces[6]}px ${props.theme.spaces[2]}px ${props.theme.spaces[11]}px`};
  .${Classes.TEXT} {
    color: ${Colors.MIRAGE_2};
  }
  ${(props) =>
    props.selected &&
    `
    background-color: ${Colors.GALLERY_1};
    .${Classes.TEXT} {
      color: ${Colors.EBONY_CLAY_2};
    }
  `}

  .${Classes.ICON} {
    visibility: ${(props) => (props.selected ? "visible" : "hidden")};
  }

  &:hover {
    background-color: ${Colors.GALLERY_1};
  }
`;

const StyledFilterCategory = styled(Text)`
  margin-bottom: ${(props) => props.theme.spaces[4]}px;
  padding-left: ${(props) => props.theme.spaces[6]}px;
`;

const ListWrapper = styled.div`
  margin-top: ${(props) => props.theme.spaces[4]}px;
`;

const FilterCategoryWrapper = styled.div`
  padding-bottom: ${(props) => props.theme.spaces[13] - 2}px;
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
  const widgetConfigs = useSelector(getWidgetCards);
  const widgets = useMemo(() => {
    return widgetConfigs.map((widget) => {
      return {
        label: widget.displayName,
        value: widget.type,
      };
    });
  }, [widgetConfigs]);
  const datasources = useSelector(templatesDatasourceFiltersSelector);

  const filters = {
    functions,
    useCases,
    widgets,
    datasources,
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
      <Text color={Colors.MIRAGE_2} type={TextType.P1}>
        {item.label}
      </Text>
      <Icon name={"close-x"} size={IconSize.XXXL} />
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
  };

  useEffect(() => {
    dispatch(filterTemplates(label, selectedItems));
  }, [selectedItems]);

  const toggleExpand = () => {
    setExpand((expand) => !expand);
  };

  return (
    <FilterCategoryWrapper>
      <StyledFilterCategory type={TextType.SIDE_HEAD}>
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
            + {filterList.slice(3).length} {createMessage(MORE)}
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
            - {createMessage(SHOW_LESS)}
          </Text>
        )}
      </ListWrapper>
    </FilterCategoryWrapper>
  );
}

function Filters() {
  const filters = useGetFilterList();

  return (
    <Wrapper>
      <SecondWrapper>
        <FilterWrapper>
          {Object.keys(filters).map((filter) => {
            return (
              <FilterCategory
                filterList={filters[filter]}
                key={filter}
                label={filter}
              />
            );
          })}
        </FilterWrapper>
        <LeftPaneBottomSection />
      </SecondWrapper>
    </Wrapper>
  );
}

export default Filters;
