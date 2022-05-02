import React from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { Collapse } from "@blueprintjs/core";
import { Classes } from "components/ads/common";
import Text, { TextType } from "components/ads/Text";
import Icon, { IconSize } from "components/ads/Icon";
import { filterTemplates } from "actions/templateActions";
import { createMessage, FILTERS } from "@appsmith/constants/messages";
import {
  getFilterListSelector,
  getTemplateFilterSelector,
} from "selectors/templatesSelectors";
import LeftPaneBottomSection from "pages/Home/LeftPaneBottomSection";
import { thinScrollbar } from "constants/DefaultTheme";
import { Colors } from "constants/Colors";
import AnalyticsUtil from "utils/AnalyticsUtil";

const FilterWrapper = styled.div`
  overflow: auto;
  height: calc(100vh - ${(props) => props.theme.homePage.header + 200}px);
  ${thinScrollbar}

  .more {
    padding-left: ${(props) => props.theme.spaces[11]}px;
    margin-top: ${(props) => props.theme.spaces[2]}px;
    cursor: pointer;
  }

  .hide {
    visibility: hidden;
  }
`;

const Wrapper = styled.div`
  width: ${(props) => props.theme.homePage.sidebar}px;
  height: 100%;
  display: flex;
  padding-left: ${(props) => props.theme.spaces[7]}px;
  padding-top: ${(props) => props.theme.spaces[11]}px;
  flex-direction: column;
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
  font-weight: bold;

  &.title {
    margin-bottom: ${(props) => props.theme.spaces[12] - 2}px;
    display: inline-block;
  }
`;

const ListWrapper = styled.div`
  margin-top: ${(props) => props.theme.spaces[4]}px;
`;

const FilterCategoryWrapper = styled.div`
  padding-bottom: ${(props) => props.theme.spaces[13] - 2}px;
`;

export type Filter = {
  label: string;
  value?: string;
};

interface FilterItemProps {
  item: Filter;
  selected: boolean;
  onSelect: (item: string, action: string) => void;
}

interface FilterCategoryProps {
  label: string;
  filterList: Filter[];
  selectedFilters: string[];
}

function FilterItem({ item, onSelect, selected }: FilterItemProps) {
  const onClick = () => {
    const action = selected ? "remove" : "add";
    const filterValue = item?.value ?? item.label;
    onSelect(filterValue, action);
    if (action === "add") {
      AnalyticsUtil.logEvent("TEMPLATE_FILTER_SELECTED", {
        filter: filterValue,
      });
    }
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

function FilterCategory({
  filterList,
  label,
  selectedFilters,
}: FilterCategoryProps) {
  // const [expand, setExpand] = useState(!!selectedFilters.length);
  const dispatch = useDispatch();
  // This indicates how many filter items do we want to show, the rest are hidden
  // behind show more.
  const FILTERS_TO_SHOW = 4;
  const onSelect = (item: string, type: string) => {
    if (type === "add") {
      dispatch(filterTemplates(label, [...selectedFilters, item]));
    } else {
      dispatch(
        filterTemplates(
          label,
          selectedFilters.filter((selectedItem) => selectedItem !== item),
        ),
      );
    }
  };

  // const toggleExpand = () => {
  //   setExpand((expand) => !expand);
  // };

  const isSelected = (filter: Filter) => {
    return selectedFilters.includes(filter?.value ?? filter.label);
  };

  return (
    <FilterCategoryWrapper>
      <StyledFilterCategory type={TextType.P4}>
        {label.toLocaleUpperCase()}{" "}
        {!!selectedFilters.length && `(${selectedFilters.length})`}
      </StyledFilterCategory>
      <ListWrapper>
        {filterList.slice(0, FILTERS_TO_SHOW).map((filter) => {
          return (
            <FilterItem
              item={filter}
              key={filter.label}
              onSelect={onSelect}
              selected={isSelected(filter)}
            />
          );
        })}
        <Collapse isOpen>
          {filterList.slice(FILTERS_TO_SHOW).map((filter) => {
            return (
              <FilterItem
                item={filter}
                key={filter.label}
                onSelect={onSelect}
                selected={isSelected(filter)}
              />
            );
          })}
        </Collapse>
        {/* We will be adding this back later */}
        {/* {!!filterList.slice(FILTERS_TO_SHOW).length && (
          <Text
            className={`more ${selectedFilters.length && expand && "hide"}`}
            onClick={toggleExpand}
            type={TextType.BUTTON_SMALL}
            underline
          >
            {expand
              ? `- ${createMessage(SHOW_LESS)}`
              : `+ ${filterList.slice(FILTERS_TO_SHOW).length} ${createMessage(
                  MORE,
                )}`}
          </Text>
        )} */}
      </ListWrapper>
    </FilterCategoryWrapper>
  );
}

function Filters() {
  const filters = useSelector(getFilterListSelector);
  const selectedFilters = useSelector(getTemplateFilterSelector);

  return (
    <Wrapper>
      <SecondWrapper>
        <FilterWrapper>
          <StyledFilterCategory className={"title"} type={TextType.H5}>
            {createMessage(FILTERS)}
          </StyledFilterCategory>
          {Object.keys(filters).map((filter) => {
            return (
              <FilterCategory
                filterList={filters[filter]}
                key={filter}
                label={filter}
                selectedFilters={selectedFilters[filter] ?? []}
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
