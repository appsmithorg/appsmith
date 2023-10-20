import React, { useCallback, useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IconWrapper } from "constants/IconConstants";
import { Colors } from "constants/Colors";
import { TableIconWrapper } from "../../../TableStyledWrappers";
import TableFilterPane from "./FilterPane";

import type {
  ReactTableColumnProps,
  ReactTableFilter,
} from "../../../Constants";

import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { generateClassName } from "utils/generators";
import { ActionItem } from "../ActionItem";
import { getTableFilterState } from "selectors/tableFilterSelectors";
import { importSvg } from "design-system-old";

const FilterIcon = importSvg(
  async () => import("assets/icons/control/filter-icon.svg"),
);

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

export const TableFilters = (props: TableFilterProps) => {
  const { columns, widgetId } = props;
  const actionItemRef = useRef<HTMLButtonElement>(null);

  //TODO(abhinav): This is incorrect, we should useReducer instead of using the global redux state
  const tableFilterPaneState = useSelector(getTableFilterState);
  const isTableFilterPaneVisible =
    tableFilterPaneState.isVisible &&
    tableFilterPaneState.widgetId === props.widgetId;
  const [filters, updateFilters] = useState(new Array<ReactTableFilter>());
  const dispatch = useDispatch();

  useEffect(() => {
    const filters: ReactTableFilter[] = props.filters ? [...props.filters] : [];
    updateFilters(filters);
  }, [props.filters]);

  const toggleFilterPane = useCallback(
    (selected: boolean) => {
      if (selected) {
        dispatch({
          type: ReduxActionTypes.SHOW_TABLE_FILTER_PANE,
          payload: { widgetId, force: true },
        });
      } else {
        dispatch({
          type: ReduxActionTypes.HIDE_TABLE_FILTER_PANE,
          payload: { widgetId },
        });
      }
    },
    [widgetId],
  );

  if (columns.length === 0) {
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

  return (
    <>
      <ActionItem
        data-testid={`t--table-filter-toggle-btn ${generateClassName(
          widgetId,
        )}`}
        icon="filter"
        onPress={() => toggleFilterPane(!isTableFilterPaneVisible)}
        ref={actionItemRef}
        title={`Filters${hasAnyFilters ? ` (${filters.length})` : ""}`}
      />
      <TableFilterPane
        targetNode={actionItemRef.current ?? undefined}
        {...props}
      />
    </>
  );
};
