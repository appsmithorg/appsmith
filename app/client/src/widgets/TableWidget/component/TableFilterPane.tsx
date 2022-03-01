import React, { Component } from "react";
import { connect } from "react-redux";
import { get } from "lodash";
import * as log from "loglevel";
import { AppState } from "reducers";
import styled from "styled-components";

import { Colors } from "constants/Colors";
import { ReactTableColumnProps, ReactTableFilter } from "./Constants";
import TableFilterPaneContent from "./TableFilterPaneContent";
import { ThemeMode, getCurrentThemeMode } from "selectors/themeSelectors";
import { Layers } from "constants/Layers";
import Popper from "pages/Editor/Popper";
import { generateClassName } from "utils/generators";
import { getTableFilterState } from "selectors/tableFilterSelectors";
import { getWidgetMetaProps } from "sagas/selectors";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { selectWidgetAction } from "actions/widgetSelectionActions";
import { ReactComponent as DragHandleIcon } from "assets/icons/ads/app-icons/draghandler.svg";

const DragBlock = styled.div`
  height: 40px;
  width: 83px;
  background: ${Colors.WHITE_SNOW};
  box-sizing: border-box;
  font-size: 12px;
  color: ${Colors.GREY_11};
  letter-spacing: 0.04em;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  span {
    padding-left: 8px;
    color: ${Colors.GREY_11};
  }
`;

export interface TableFilterPaneProps {
  widgetId: string;
  columns: ReactTableColumnProps[];
  filters?: ReactTableFilter[];
  applyFilter: (filters: ReactTableFilter[]) => void;
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

      /*
        Prevent the FilterPane from overflowing the canvas when the 
        table widget is on the very top of the canvas.
      */
      const boundaryParent = document.querySelector('[type="CANVAS_WIDGET"]');

      return (
        <Popper
          boundaryParent={boundaryParent || "viewport"}
          disablePopperEvents={get(this.props, "metaProps.isMoved", false)}
          isDraggable
          isOpen
          onPositionChange={this.handlePositionUpdate}
          parentElement={boundaryParent}
          placement="top"
          position={get(this.props, "metaProps.position") as PositionPropsInt}
          renderDragBlock={
            <DragBlock>
              <DragHandleIcon />
              <span>Move</span>
            </DragBlock>
          }
          renderDragBlockPositions={{
            left: "0px",
          }}
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
      dispatch(selectWidgetAction(widgetId));
    },
    hideFilterPane: (widgetId: string) => {
      dispatch({
        type: ReduxActionTypes.HIDE_TABLE_FILTER_PANE,
        payload: { widgetId },
      });
      dispatch(selectWidgetAction(widgetId));
    },
  };
};
export default connect(mapStateToProps, mapDispatchToProps)(TableFilterPane);
