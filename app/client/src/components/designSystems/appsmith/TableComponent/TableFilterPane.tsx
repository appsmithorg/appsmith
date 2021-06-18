import React, { Component } from "react";
import { connect } from "react-redux";
import { get } from "lodash";
import * as log from "loglevel";
import { AppState } from "reducers";

import {
  ReactTableColumnProps,
  ReactTableFilter,
} from "components/designSystems/appsmith/TableComponent/Constants";
import TableFilterPaneContent from "components/designSystems/appsmith/TableComponent/TableFilterPaneContent";
import { ThemeMode, getCurrentThemeMode } from "selectors/themeSelectors";
import { Layers } from "constants/Layers";
import Popper from "pages/Editor/Popper";
import { generateClassName } from "utils/generators";
import { getTableFilterState } from "selectors/tableFilterSelectors";
import { getWidgetMetaProps } from "sagas/selectors";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { selectWidget } from "actions/widgetActions";

export interface TableFilterPaneProps {
  widgetId: string;
  columns: ReactTableColumnProps[];
  filters?: ReactTableFilter[];
  applyFilter: (filters: ReactTableFilter[]) => void;
  editMode: boolean;
}

interface PositionPropsInt {
  top: number;
  left: number;
}

type Props = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps> &
  TableFilterPaneProps;

class TableFilterPane extends Component<Props> {
  getPopperTheme() {
    return ThemeMode.LIGHT;
  }

  handlePositionUpdate = (position: any) => {
    this.props.setPanePoistion(
      this.props.tableFilterPane.widgetId as string,
      position,
    );
  };

  render() {
    if (
      this.props.tableFilterPane.isVisible &&
      this.props.tableFilterPane.widgetId === this.props.widgetId
    ) {
      log.debug("tablefilter pane rendered");
      const className =
        "t--table-filter-toggle-btn " +
        generateClassName(this.props.tableFilterPane.widgetId);
      const el = document.getElementsByClassName(className)[0];
      return (
        <Popper
          disablePopperEvents={get(this.props, "metaProps.isMoved", false)}
          isDraggable
          isOpen
          onPositionChange={this.handlePositionUpdate}
          placement="top"
          position={get(this.props, "metaProps.position") as PositionPropsInt}
          targetNode={el}
          themeMode={this.getPopperTheme()}
          zIndex={Layers.tableFilterPane}
        >
          <TableFilterPaneContent {...this.props} />
        </Popper>
      );
    } else {
      return null;
    }
  }
}

const mapStateToProps = (state: AppState, ownProps: TableFilterPaneProps) => {
  return {
    tableFilterPane: getTableFilterState(state),
    themeMode: getCurrentThemeMode(state),
    metaProps: getWidgetMetaProps(state, ownProps.widgetId),
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    setPanePoistion: (widgetId: string, position: any) => {
      dispatch({
        type: ReduxActionTypes.TABLE_PANE_MOVED,
        payload: {
          widgetId,
          position,
        },
      });
      dispatch(selectWidget(widgetId));
    },
    hideFilterPane: (widgetId: string) => {
      dispatch({
        type: ReduxActionTypes.HIDE_TABLE_FILTER_PANE,
        payload: { widgetId },
      });
      dispatch(selectWidget(widgetId));
    },
  };
};
export default connect(mapStateToProps, mapDispatchToProps)(TableFilterPane);
