import { SEARCH_TEMPLATES, createMessage } from "@appsmith/constants/messages";
import {
  filterTemplates,
  setTemplateSearchQuery,
} from "actions/templateActions";
import { Icon, SearchInput } from "design-system";
import { debounce } from "lodash";
import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getFilterListSelector,
  getTemplateFilterSelector,
  getTemplateSearchQuery,
} from "selectors/templatesSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  FilterCategoryWrapper,
  FilterItemText,
  FilterItemWrapper,
  FilterWrapper,
  ListWrapper,
  SearchWrapper,
  StyledFilterCategory,
} from "./StyledComponents";

export interface Filter {
  label: string;
  value?: string;
}

interface FilterItemProps {
  item: Filter;
  selectedFilter: boolean;
  onSelectFilter: (item: string, action: "add" | "remove") => void;
}

interface FilterCategoryProps {
  label: string;
  filterList: Filter[];
  selectedFilters: string[];
}

interface FilterWrapperProps {
  stickySearchBar?: boolean;
}

const ALL_TEMPLATES_UPDATED_LABEL = "All Templates";
const ALL_TEMPLATES_FILTER_VALUE = "All";

const FilterItem = ({
  item,
  onSelectFilter,
  selectedFilter,
}: FilterItemProps) => {
  const onClick = () => {
    const action = selectedFilter ? "remove" : "add";
    const filterValue = item?.value ?? item.label;
    onSelectFilter(filterValue, action);
    if (action === "add") {
      AnalyticsUtil.logEvent("TEMPLATE_FILTER_SELECTED", {
        filter: filterValue,
      });
    }
  };

  return (
    <FilterItemWrapper onClick={onClick} selected={selectedFilter}>
      <FilterItemText kind="body-m">{item.label}</FilterItemText>
      {selectedFilter && (
        <Icon
          color="var(--ads-v2-color-bg-brand-secondary-emphasis-plus)"
          name="check-line"
          size="md"
        />
      )}
    </FilterItemWrapper>
  );
};

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

const FilterCategory = ({
  filterList,
  label,
  selectedFilters,
}: FilterCategoryProps) => {
  const filterLabelsToDisplay: Record<string, string> = useMemo(
    () => ({
      functions: "categories",
    }),
    [],
  );
  const dispatch = useDispatch();
  const onSelectFilter = (item: string, type: string) => {
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
              onSelectFilter={onSelectFilter}
              selectedFilter={isSelected(filter)}
            />
          );
        })}
      </ListWrapper>
    </FilterCategoryWrapper>
  );
};

const INPUT_DEBOUNCE_TIMER = 500;
const DEFAULT_FILTER_LABEL = "functions";
const DEFAULT_FILTER_LIST = ["All"];
const StartWithTemplateFilters = (props: FilterWrapperProps) => {
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
};

export default StartWithTemplateFilters;
