import React, { useMemo } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { Checkbox, Text } from "design-system";
import { filterTemplates } from "actions/templateActions";
import {
  getFilterListSelector,
  getTemplateFilterSelector,
} from "selectors/templatesSelectors";
import { thinScrollbar } from "constants/DefaultTheme";
import AnalyticsUtil from "utils/AnalyticsUtil";

const FilterWrapper = styled.div`
  overflow: auto;
  height: calc(100vh - ${(props) => props.theme.homePage.header + 256}px);
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

const FilterItemWrapper = styled.div<{ selected: boolean }>`
  padding: ${(props) =>
    `${props.theme.spaces[4]}px 0px 0px ${props.theme.spaces[11] - 10}px `};

  .ads-v2-checkbox__label {
    line-height: 16px;
  }
`;

const StyledFilterCategory = styled(Text)`
  margin-bottom: 16px;
  padding-left: ${(props) => props.theme.spaces[6]}px;
  font-weight: bold;
  text-transform: capitalize;
  font-size: 13px;

  &.title {
    margin-bottom: ${(props) => props.theme.spaces[12] - 10}px;
    color: var(--ads-v2-color-fg-emphasis);
  }
`;

const ListWrapper = styled.div`
  margin-top: ${(props) => props.theme.spaces[4]}px;
`;

const FilterCategoryWrapper = styled.div`
  padding-bottom: ${(props) => props.theme.spaces[13] - 11}px;
`;

export interface Filter {
  label: string;
  value?: string;
}

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
    <FilterItemWrapper selected={selected}>
      <Checkbox
        // backgroundColor={Colors.GREY_900}
        // className="filter"
        isSelected={selected}
        name={item.label}
        onChange={onClick}
        value={item.label}
      >
        {item.label}
      </Checkbox>
    </FilterItemWrapper>
  );
}

function FilterCategory({
  filterList,
  label,
  selectedFilters,
}: FilterCategoryProps) {
  const filterLabelsToDisplay: Record<string, string> = useMemo(
    () => ({
      functions: "teams",
    }),
    [],
  );
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
      <StyledFilterCategory kind="body-m" renderAs="h4">
        {`${filterLabelsToDisplay[label] ?? label} `}
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
        <>
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
        </>
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
    <FilterWrapper className="filter-wrapper">
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
  );
}

export default Filters;
