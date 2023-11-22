import { SEARCH_TEMPLATES, createMessage } from "@appsmith/constants/messages";
import {
  filterTemplates,
  setTemplateSearchQuery,
} from "actions/templateActions";
import { Icon, SearchInput, Text } from "design-system";
import { debounce } from "lodash";
import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getFilterListSelector,
  getTemplateFilterSelector,
  getTemplateSearchQuery,
} from "selectors/templatesSelectors";
import styled from "styled-components";
import AnalyticsUtil from "utils/AnalyticsUtil";

const FilterWrapper = styled.div`
  margin-top: 120px;
  padding-top: 11px;
  overflow: auto;
  height: calc(100vh - ${(props) => props.theme.homePage.header + 256}px);

  .more {
    padding-left: ${(props) => props.theme.spaces[11]}px;
    cursor: pointer;
  }

  .hide {
    visibility: hidden;
  }
`;

const FilterItemWrapper = styled.div<{ selected: boolean }>`
  padding: 8px;
  background-color: ${(props) =>
    props.selected ? "var(--ads-v2-color-bg)" : "inherit"};
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
  border-radius: var(--ads-v2-border-radius);
  cursor: pointer;
`;

const FilterItemText = styled(Text)`
  font-size: 14px;
  font-weight: 400;
`;

const StyledFilterCategory = styled(Text)`
  margin-top: 12px;
  padding-left: 8px;
  text-transform: capitalize;
  font-size: 14px;
  font-weight: 500;

  &.title {
    color: var(--ads-v2-color-fg-emphasis);
  }
`;

const ListWrapper = styled.div`
  margin-top: ${(props) => props.theme.spaces[2]}px;
`;

const FilterCategoryWrapper = styled.div`
  padding-bottom: ${(props) => props.theme.spaces[13] - 11}px;
`;

const SearchWrapper = styled.div<{ sticky?: boolean }>`
  /* max-width: 250px; */
  .templates-search {
    max-width: 250px;
  }
  ${(props) =>
    props.sticky &&
    `position: sticky;
  top: 0;
  position: -webkit-sticky;
  z-index: 1;
  background-color: var(--ads-v2-color-bg);
  padding: var(--ads-v2-spaces-7);
  margin-left: 0; 
  `}
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

interface FilterWrapperProps {
  stickySearchBar?: boolean;
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
    <FilterItemWrapper onClick={onClick} selected={selected}>
      <FilterItemText kind="body-m">{item.label}</FilterItemText>
      {selected && (
        <Icon
          color="var(--ads-v2-color-bg-brand-secondary-emphasis-plus)"
          name="check-line"
          size="md"
        />
      )}
    </FilterItemWrapper>
  );
}

const ALL_TEMPLATES_UPDATED_LABEL = "All Templates";
const ALL_TEMPLATES_FILTER_VALUE = "All";

function modifyAndSortFilterList(originalFilterList: Filter[]) {
  // Change the label from "All" to "All Templates"
  const modifiedFilterList = originalFilterList.map((filter) => {
    if (filter.label === ALL_TEMPLATES_FILTER_VALUE) {
      return { ...filter, label: ALL_TEMPLATES_UPDATED_LABEL };
    }
    return filter;
  });

  // Sort the filterList with "All Templates" coming first
  modifiedFilterList.sort((a, b) => {
    if (a.label === ALL_TEMPLATES_UPDATED_LABEL) return -1;
    if (b.label === ALL_TEMPLATES_UPDATED_LABEL) return 1;
    return a.label.localeCompare(b.label);
  });

  return modifiedFilterList;
}

function FilterCategory({
  filterList,
  label,
  selectedFilters,
}: FilterCategoryProps) {
  const filterLabelsToDisplay: Record<string, string> = useMemo(
    () => ({
      functions: "categories",
    }),
    [],
  );
  const dispatch = useDispatch();
  const onSelect = (item: string, type: string) => {
    // Check if "All" or "All Templates" is selected
    const allTemplatesFilterSelected =
      item === ALL_TEMPLATES_FILTER_VALUE ||
      item === ALL_TEMPLATES_UPDATED_LABEL;

    if (type === "add") {
      // If "All" or "All Templates" is selected, set filterList to ["All"] only
      const filterList = allTemplatesFilterSelected
        ? [ALL_TEMPLATES_FILTER_VALUE]
        : [
            ...selectedFilters.filter(
              (selectedItem) => selectedItem !== ALL_TEMPLATES_FILTER_VALUE, // Remove "All" if it exists
            ),
            item,
          ];
      dispatch(filterTemplates(label, filterList));
    } else {
      // If "All" or "All Templates" is selected for removal, do nothing
      if (allTemplatesFilterSelected) return;

      const filterList =
        selectedFilters.length === 1
          ? [ALL_TEMPLATES_FILTER_VALUE] // If this is the last filter, set filterList to default ["All"]
          : selectedFilters.filter((selectedItem) => selectedItem !== item);

      dispatch(filterTemplates(label, filterList));
    }
  };

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
        {modifyAndSortFilterList(filterList).map((filter) => {
          return (
            <FilterItem
              item={filter}
              key={filter.label}
              onSelect={onSelect}
              selected={isSelected(filter)}
            />
          );
        })}
      </ListWrapper>
    </FilterCategoryWrapper>
  );
}

const INPUT_DEBOUNCE_TIMER = 500;
const DEFAULT_FILTER_LABEL = "functions";
const DEFAULT_FILTER_LIST = ["All"];
function FiltersRevamp(props: FilterWrapperProps) {
  const dispatch = useDispatch();
  const filters = useSelector(getFilterListSelector);
  const selectedFilters = useSelector(getTemplateFilterSelector);
  const templateSearchQuery = useSelector(getTemplateSearchQuery);
  const onChange = debounce((query: string) => {
    dispatch(setTemplateSearchQuery(query));
    AnalyticsUtil.logEvent("TEMPLATES_SEARCH_INPUT_EVENT", { query });
  }, INPUT_DEBOUNCE_TIMER);

  useEffect(() => {
    // Set the default "All" filter when the component mounts
    dispatch(filterTemplates(DEFAULT_FILTER_LABEL, DEFAULT_FILTER_LIST));
  }, []);

  return (
    <FilterWrapper className="filter-wrapper">
      <SearchWrapper sticky={props.stickySearchBar}>
        <div className="templates-search">
          <SearchInput
            data-testid={"t--application-search-input"}
            isDisabled={false}
            onChange={onChange}
            placeholder={createMessage(SEARCH_TEMPLATES)}
            value={templateSearchQuery}
          />
        </div>
      </SearchWrapper>

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

export default FiltersRevamp;
