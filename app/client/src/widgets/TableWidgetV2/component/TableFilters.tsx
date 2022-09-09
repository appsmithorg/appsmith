import React, { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IconWrapper } from "constants/IconConstants";
import { Colors } from "constants/Colors";
import { TableIconWrapper } from "./TableStyledWrappers";
import TableFilterPane from "./TableFilterPane";

import {
  ReactTableColumnProps,
  ReactTableFilter,
  OperatorTypes,
} from "./Constants";

//TODO(abhinav): All of the following imports should not exist in a widget component
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { generateClassName } from "utils/generators";
import { getTableFilterState } from "selectors/tableFilterSelectors";
import { ReactComponent as FilterIcon } from "assets/icons/control/filter-icon.svg";
import TableAction from "./TableAction";

export interface DropdownOption {
  label: string;
  value: string;
  type: string;
}
interface TableFilterProps {
  columns: ReactTableColumnProps[];
  filters?: ReactTableFilter[];
  applyFilter: (filters: ReactTableFilter[]) => void;
  widgetId: string;
  accentColor: string;
  borderRadius: string;
}

function TableFilters(props: TableFilterProps) {
  const [filters, updateFilters] = React.useState(
    new Array<ReactTableFilter>(),
  );

  const dispatch = useDispatch();
  //TODO(abhinav): This is incorrect, we should useReducer instead of using the global redux state
  const tableFilterPaneState = useSelector(getTableFilterState);

  useEffect(() => {
    const filters: ReactTableFilter[] = props.filters ? [...props.filters] : [];
    if (filters.length === 0) {
      filters.push({
        column: "",
        operator: OperatorTypes.OR,
        value: "",
        condition: "",
      });
    }
    updateFilters(filters);
  }, [props.filters]);

  const toggleFilterPane = useCallback(
    (selected: boolean) => {
      if (selected) {
        // filter button select
        dispatch({
          type: ReduxActionTypes.SHOW_TABLE_FILTER_PANE,
          payload: { widgetId: props.widgetId, force: true },
        });
      } else {
        // filter button de-select
        dispatch({
          type: ReduxActionTypes.HIDE_TABLE_FILTER_PANE,
          payload: { widgetId: props.widgetId },
        });
      }
    },
    [props.widgetId],
  );

  if (props.columns.length === 0) {
    return (
      <TableIconWrapper disabled>
        <IconWrapper color={Colors.CADET_BLUE} height={20} width={20}>
          <FilterIcon />
        </IconWrapper>
      </TableIconWrapper>
    );
  }

  const hasAnyFilters = !!(
    filters.length >= 1 &&
    filters[0].column &&
    filters[0].condition
  );
  const className =
    "t--table-filter-toggle-btn " + generateClassName(props.widgetId);
  const isTableFilterPaneVisible =
    tableFilterPaneState.isVisible &&
    tableFilterPaneState.widgetId === props.widgetId;

  return (
    <>
      <TableAction
        className={className}
        icon="filter"
        selectMenu={toggleFilterPane}
        selected={isTableFilterPaneVisible}
        title={`Filters${hasAnyFilters ? ` (${filters.length})` : ""}`}
        titleColor={hasAnyFilters ? Colors.CODE_GRAY : Colors.GRAY}
      />
      <TableFilterPane {...props} />
    </>
  );
}

export default TableFilters;
