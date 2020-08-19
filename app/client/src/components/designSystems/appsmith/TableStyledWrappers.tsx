import styled from "styled-components";
import { TableSizes } from "widgets/TableWidget";
import { Colors, Color } from "constants/Colors";
import { scrollbarLight } from "constants/DefaultTheme";

export const TableWrapper = styled.div<{
  width: number;
  height: number;
  tableSizes: TableSizes;
  backgroundColor?: Color;
}>`
  width: 100%;
  height: 100%;
  background: white;
  border: 1px solid ${Colors.GEYSER_LIGHT};
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  overflow: hidden;
  .tableWrap {
    height: 100%;
    display: block;
    overflow-x: auto;
    overflow-y: hidden;
  }
  .table {
    border-spacing: 0;
    color: ${Colors.THUNDER};
    position: relative;
    background: ${Colors.ATHENS_GRAY_DARKER};
    .thead,
    .tbody {
      overflow: hidden;
    }
    .tbody {
      overflow-y: scroll;
      /* Subtracting 9px to handling widget padding */
      height: ${props =>
        props.height -
        props.tableSizes.TABLE_HEADER_HEIGHT -
        props.tableSizes.COLUMN_HEADER_HEIGHT -
        9}px;
      .tr {
        width: 100%;
      }
    }
    .tr {
      overflow: hidden;
      :nth-child(even) {
        background: ${Colors.ATHENS_GRAY_DARKER};
      }
      :nth-child(odd) {
        background: ${Colors.WHITE};
      }
      &.selected-row {
        background: ${Colors.POLAR};
        &:hover {
          background: ${Colors.POLAR};
        }
      }
      &:hover {
        background: ${Colors.ATHENS_GRAY};
      }
    }
    .th,
    .td {
      margin: 0;
      padding: 9px 10px;
      border-bottom: 1px solid ${Colors.GEYSER_LIGHT};
      border-right: 1px solid ${Colors.GEYSER_LIGHT};
      position: relative;
      font-size: ${props => props.tableSizes.ROW_FONT_SIZE}px;
      line-height: ${props => props.tableSizes.ROW_FONT_SIZE}px;
      :last-child {
        border-right: 0;
      }
      .resizer {
        display: inline-block;
        width: 10px;
        height: 100%;
        position: absolute;
        right: 0;
        top: 0;
        transform: translateX(50%);
        z-index: 1;
        ${"" /* prevents from scrolling while dragging on touch devices */}
        touch-action:none;
        &.isResizing {
          cursor: isResizing;
        }
      }
    }
    .th {
      padding: 0 10px 0 0;
      height: ${props => props.tableSizes.COLUMN_HEADER_HEIGHT}px;
      line-height: ${props => props.tableSizes.COLUMN_HEADER_HEIGHT}px;
      background: ${Colors.ATHENS_GRAY_DARKER};
    }
    .td {
      height: ${props => props.tableSizes.ROW_HEIGHT}px;
      line-height: ${props => props.tableSizes.ROW_HEIGHT}px;
      padding: 0 10px;
    }
  }
  .draggable-header,
  .hidden-header {
    width: 100%;
    text-overflow: ellipsis;
    overflow: hidden;
    color: ${Colors.OXFORD_BLUE};
    font-weight: 500;
    padding-left: 10px;
    &.sorted {
      padding-left: 5px;
    }
  }
  .draggable-header {
    cursor: pointer;
    &.reorder-line {
      width: 1px;
      height: 100%;
    }
  }
  .hidden-header {
    opacity: 0.6;
  }
  .column-menu {
    cursor: pointer;
    height: ${props => props.tableSizes.COLUMN_HEADER_HEIGHT}px;
    line-height: ${props => props.tableSizes.COLUMN_HEADER_HEIGHT}px;
  }
  .th {
    display: flex;
    justify-content: space-between;
    &.highlight-left {
      border-left: 2px solid ${Colors.GREEN};
    }
    &.highlight-right {
      border-right: 2px solid ${Colors.GREEN};
    }
  }
  .input-group {
    height: ${props => props.tableSizes.COLUMN_HEADER_HEIGHT}px;
    line-height: ${props => props.tableSizes.COLUMN_HEADER_HEIGHT}px;
    padding: 0 5px;
  }
`;

export const DropDownWrapper = styled.div`
  display: flex;
  flex-direction: column;
  background: white;
  z-index: 1;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid ${Colors.ATHENS_GRAY};
  box-shadow: 0px 2px 4px rgba(67, 70, 74, 0.14);
`;

export const OptionWrapper = styled.div<{ selected: boolean }>`
  display: flex;
  width: 100%;
  justify-content: space-between;
  height: 32px;
  box-sizing: border-box;
  padding: 8px;
  color: ${props => (props.selected ? Colors.WHITE : Colors.OXFORD_BLUE)};
  font-size: 14px;
  min-width: 200px;
  cursor: pointer;
  border-radius: 4px;
  margin: 3px 0;
  background: ${props => (props.selected ? Colors.GREEN : Colors.WHITE)};
  &:hover {
    background: ${props => (props.selected ? Colors.GREEN : Colors.POLAR)};
  }
  .column-type {
    width: 100%;
  }
  &.non-selectable {
    color: ${Colors.GRAY};
    pointer-events: none;
  }
`;

export const IconOptionWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  cursor: pointer;
`;

export const PaginationWrapper = styled.div`
  box-sizing: border-box;
  display: flex;
  width: 100%;
  justify-content: flex-end;
  align-items: center;
  padding: 8px 20px;
`;

export const PaginationItemWrapper = styled.div<{
  disabled?: boolean;
  selected?: boolean;
}>`
  background: ${props => (props.disabled ? Colors.ATHENS_GRAY : Colors.WHITE)};
  border: 1px solid
    ${props => (props.selected ? Colors.GREEN : Colors.GEYSER_LIGHT)};
  box-sizing: border-box;
  border-radius: 4px;
  width: 24px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 4px;
  pointer-events: ${props => props.disabled && "none"};
  cursor: pointer;
  &:hover {
    border-color: ${Colors.GREEN};
  }
`;

export const MenuColumnWrapper = styled.div<{ selected: boolean }>`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  background: ${props => props.selected && Colors.GREEN};
  position: relative;
  .title {
    color: ${props => (props.selected ? Colors.WHITE : Colors.OXFORD_BLUE)};
    margin-left: 10px;
  }
  .sub-menu {
    position: absolute;
    right: 0;
  }
`;

export const ActionWrapper = styled.div`
  margin: 0 5px 0 0;
  &&&&&& {
    .bp3-button span {
      font-weight: 400;
    }
  }
`;

export const CellWrapper = styled.div<{ isHidden?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  height: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: ${props => (props.isHidden ? "0.6" : "1")};
  .image-cell {
    width: 40px;
    height: 32px;
    margin: 0 5px 0 0;
    border-radius: 4px;
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
  }
  video {
    border-radius: 4px;
  }
  &.video-cell {
    height: 100%;
    iframe {
      border: none;
      border-radius: 4px;
    }
  }
`;

export const TableHeaderWrapper = styled.div<{
  serverSidePaginationEnabled: boolean;
  width: number;
  tableSizes: TableSizes;
  backgroundColor?: Color;
}>`
  display: flex;
  border-bottom: 1px solid ${Colors.GEYSER_LIGHT};
  width: ${props => props.width}px;
  .show-page-items {
    display: ${props => (props.width < 700 ? "none" : "flex")};
  }
  overflow-x: scroll;
  overflow-y: hidden;
  height: ${props => props.tableSizes.TABLE_HEADER_HEIGHT}px;
  min-height: ${props => props.tableSizes.TABLE_HEADER_HEIGHT}px;
  ${scrollbarLight};
`;

export const CommonFunctionsMenuWrapper = styled.div<{
  tableSizes: TableSizes;
}>`
  display: flex;
  align-items: center;
  height: ${props => props.tableSizes.TABLE_HEADER_HEIGHT}px;
`;

export const RowWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  line-height: 20px;
  color: ${Colors.BLUE_BAYOUX};
  margin: 0 4px;
  white-space: nowrap;
`;

export const TableIconWrapper = styled.div<{
  selected?: boolean;
  disabled?: boolean;
}>`
  background: ${props => (props.selected ? Colors.ATHENS_GRAY : "transparent")};
  box-shadow: ${props =>
    props.selected ? `inset 0px 4px 0px ${Colors.GREEN}` : "none"};
  width: 48px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${props => (props.disabled ? 0.6 : 1)};
  cursor: ${props => !props.disabled && "pointer"};
  &:hover {
    background: ${Colors.ATHENS_GRAY};
  }
`;

export const SortIconWrapper = styled.div<{ rotate: boolean }>`
  transform: ${props => (props.rotate ? "rotate(180deg)" : "none")};
`;
