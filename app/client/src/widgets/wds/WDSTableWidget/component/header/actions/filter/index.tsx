import { Button } from "@design-system/widgets";
import React, { useCallback, useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import TableFilterPane from "./FilterPane";

import type {
  ReactTableColumnProps,
  ReactTableFilter,
} from "../../../Constants";

import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { generateClassName } from "utils/generators";
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

  const hasAnyFilters = !!(
    filters.length >= 1 &&
    filters[0].column &&
    filters[0].condition
  );

  return (
    <>
      <Button
        data-testid={`t--table-filter-toggle-btn ${generateClassName(
          widgetId,
        )}`}
        icon={FilterIcon}
        isDisabled={columns.length === 0}
        onPress={() => toggleFilterPane(!isTableFilterPaneVisible)}
        ref={actionItemRef}
        variant="ghost"
      >
        {`Filters${hasAnyFilters ? ` (${filters.length})` : ""}`}
      </Button>
      <TableFilterPane
        targetNode={actionItemRef.current ?? undefined}
        {...props}
      />
    </>
  );
};
